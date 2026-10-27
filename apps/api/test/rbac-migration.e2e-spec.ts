import { PGlite } from '@electric-sql/pglite';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const API_ROOT = resolve(__dirname, '..');
const PRISMA_CLI = resolve(
  dirname(
    createRequire(resolve(API_ROOT, 'package.json')).resolve(
      'prisma/package.json',
    ),
  ),
  'build/index.js',
);
const MIGRATIONS_ROOT = resolve(API_ROOT, 'prisma/migrations');
const MIGRATION_SQL = readdirSync(MIGRATIONS_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .map((name) =>
    readFileSync(resolve(MIGRATIONS_ROOT, name, 'migration.sql'), 'utf8'),
  );
if (!MIGRATION_SQL.length) throw new Error('No Prisma migrations found');
const FIXTURE_SQL = `
  INSERT INTO roles (id, name, description, status, update_at) VALUES
    ('patient-role', 'PATIENT', 'Patient', 'ACTIVE', '2026-01-01'),
    ('doctor-role', 'DOCTOR', 'Disabled doctor', 'INACTIVE', '2026-01-01');
  INSERT INTO permissions (id, name, description, status, update_at) VALUES
    ('read-me', 'USERS_READ_ME', 'Read own profile', 'ACTIVE', '2026-01-01');
  INSERT INTO info_permissions (id, "roleId", "permissionId", description, update_at) VALUES
    ('patient-read', 'patient-role', 'read-me', 'Patient read profile', '2026-01-01');
  INSERT INTO users (id, full_name, email, password_hash, status, "roleId") VALUES
    ('11111111-1111-4111-8111-111111111111', 'Patient', 'patient@example.com', 'existing-hash', 'ACTIVE', 'patient-role');
  INSERT INTO auth_sessions (id, user_id, refresh_token_hash, client_type, expires_at) VALUES
    ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'existing-refresh-hash', 'WEB', '2027-01-01');
  INSERT INTO user_auth_identities (id, user_id, provider, provider_subject) VALUES
    ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'GOOGLE', 'existing-subject');
`;

async function schemaSnapshot(db: PGlite) {
  return {
    columns: (
      await db.query(
        `SELECT table_name, column_name, is_nullable, data_type, udt_name, column_default FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, column_name`,
      )
    ).rows,
    constraints: (
      await db.query(
        // Prisma does not express CHECK constraints; migration-specific tests verify them.
        `SELECT c.relname AS table_name, con.conname, pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON con.conrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND con.contype <> 'c' ORDER BY c.relname, con.conname`,
      )
    ).rows,
    indexes: (
      await db.query(
        `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname`,
      )
    ).rows,
  };
}
describe('Current Prisma migrations and authentication schema (in-memory PostgreSQL)', () => {
  let db: PGlite;
  beforeAll(async () => {
    db = new PGlite();
    for (const sql of MIGRATION_SQL) await db.exec(sql);
    await db.exec(FIXTURE_SQL);
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });

  it('stores sessions tied to users and enforces unique refresh hashes', async () => {
    expect(
      (
        await db.query(
          `SELECT user_id, refresh_token_hash, client_type, revoked_at FROM auth_sessions`,
        )
      ).rows,
    ).toEqual([
      {
        user_id: '11111111-1111-4111-8111-111111111111',
        refresh_token_hash: 'existing-refresh-hash',
        client_type: 'WEB',
        revoked_at: null,
      },
    ]);
    await expect(
      db.exec(
        `INSERT INTO auth_sessions (user_id, refresh_token_hash, client_type, expires_at) VALUES ('11111111-1111-4111-8111-111111111111', 'existing-refresh-hash', 'MOBILE', '2027-01-01')`,
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      db.exec(
        `INSERT INTO auth_sessions (user_id, refresh_token_hash, client_type, expires_at) VALUES ('99999999-9999-4999-8999-999999999999', 'unowned-hash', 'WEB', '2027-01-01')`,
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });
  it('supports phone-only registration and rejects ambiguous contacts and duplicate grants', async () => {
    await db.exec(
      `INSERT INTO users (full_name, phone, "roleId") VALUES ('Phone patient', '+84901234567', 'patient-role')`,
    );
    expect(
      (await db.query(`SELECT email FROM users WHERE phone = '+84901234567'`))
        .rows,
    ).toEqual([{ email: null }]);
    await expect(
      db.exec(
        `INSERT INTO users (full_name, phone, "roleId") VALUES ('Duplicate phone', '+84901234567', 'patient-role')`,
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      db.exec(
        `INSERT INTO users (full_name, email, "roleId") VALUES ('Duplicate email', 'patient@example.com', 'patient-role')`,
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      db.exec(
        `INSERT INTO info_permissions (id, "roleId", "permissionId", description, update_at) VALUES ('duplicate', 'patient-role', 'read-me', 'Duplicate', NOW())`,
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });
  it('does not create an OTP table', async () => {
    expect(
      (
        await db.query(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('otp', 'otps')`,
        )
      ).rows,
    ).toEqual([]);
  });

  it('locks UUID accounts using a bound UUID parameter', async () => {
    await db.exec('BEGIN');
    try {
      expect(
        (
          await db.query(
            'SELECT id FROM users WHERE id = $1::uuid FOR UPDATE',
            ['11111111-1111-4111-8111-111111111111'],
          )
        ).rows,
      ).toEqual([{ id: '11111111-1111-4111-8111-111111111111' }]);
    } finally {
      await db.exec('ROLLBACK');
    }
  });
  it('matches the complete active Prisma schema', async () => {
    const expected = new PGlite();
    try {
      const sql = execFileSync(
        process.execPath,
        [
          PRISMA_CLI,
          'migrate',
          'diff',
          '--from-empty',
          '--to-schema',
          'prisma/schema.prisma',
          '--script',
        ],
        {
          cwd: API_ROOT,
          encoding: 'utf8',
          env: {
            ...process.env,
            DATABASE_URL: 'postgresql://unused:unused@localhost:1/unused',
          },
        },
      );
      await expected.exec(sql);
      expect(await schemaSnapshot(db)).toEqual(await schemaSnapshot(expected));
    } finally {
      await expected.close();
    }
  }, 30000);
  it('rolls back a conflicting identity transaction while preserving the existing account', async () => {
    await db.exec('BEGIN');
    try {
      await db.exec(
        `INSERT INTO users (full_name, email, "roleId") VALUES ('New account', 'rollback@example.com', 'patient-role')`,
      );
      await expect(
        db.exec(
          `INSERT INTO users (full_name, email, "roleId") VALUES ('Duplicate', 'patient@example.com', 'patient-role')`,
        ),
      ).rejects.toMatchObject({
        code: '23505',
      });
    } finally {
      await db.exec('ROLLBACK');
    }
    expect(
      (
        await db.query(
          `SELECT count(*) FROM users WHERE email = 'rollback@example.com'`,
        )
      ).rows,
    ).toEqual([{ count: 0 }]);
    expect(
      (
        await db.query(
          `SELECT password_hash FROM users WHERE email = 'patient@example.com'`,
        )
      ).rows,
    ).toEqual([{ password_hash: 'existing-hash' }]);
  }, 30000);
});
