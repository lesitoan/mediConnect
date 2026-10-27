import 'dotenv/config';
import assert from 'node:assert/strict';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { RoleEnum } from '../src/modules/users/constants/roles.constant';

// Run from apps/api: npx tsx prisma/seed-clinic.ts (DATABASE_URL must use the current Prisma schema).
// Descriptions paraphrase hospital sources checked on 2026-10-27, limited to outpatient care.
// All identities, academic credentials and DEMO licenses are fictional. Never run this dataset in production.
export const CLINIC_SPECIALTIES = [
  {
    code: 'SPEC-GEN',
    name: 'Nội tổng quát',
    roomCode: 'P101',
    description:
      'Khám, đánh giá và điều trị ngoại trú các bệnh nội khoa ở người trưởng thành. Theo dõi bệnh mạn tính như tăng huyết áp, đái tháo đường và rối loạn chuyển hóa; tư vấn điều chỉnh lối sống, dự phòng và phối hợp khám chuyên khoa khi cần.',
    sourceUrls: ['https://tamanhhospital.vn/chuyen-khoa/noi-tong-hop/'],
    doctors: [
      {
        doctorCode: 'SEED-GEN-01',
        academicTitle: 'ASSOCIATE_PROFESSOR',
        qualification: 'TS.BS',
        fullName: 'Nguyễn Minh An',
        bio: 'Khám nội tổng quát người trưởng thành, theo dõi tăng huyết áp và tư vấn thay đổi lối sống.',
      },
      {
        doctorCode: 'SEED-GEN-02',
        academicTitle: null,
        qualification: 'ThS.BS',
        fullName: 'Trần Thu Hà',
        bio: 'Theo dõi đái tháo đường, rối loạn chuyển hóa và quản lý các vấn đề nội khoa cần tái khám định kỳ.',
      },
    ],
  },
  {
    code: 'SPEC-SUR',
    name: 'Ngoại tổng quát',
    roomCode: 'P102',
    description:
      'Khám và đánh giá ban đầu các bệnh lý ngoại khoa như thoát vị, bệnh hậu môn trực tràng và khối bất thường. Chăm sóc vết thương, thay băng, cắt chỉ và theo dõi sau mổ theo chỉ định; chuyển đến bệnh viện khi cần phẫu thuật hoặc xử trí vượt khả năng phòng khám.',
    sourceUrls: [
      'https://tamanhhospital.vn/chuyen-khoa/ngoai-tong-hop/',
      'https://benhvienungbuouhanoi.vn/cau-hoi-toi-tieu-phau-o-vien-va-muon-thay-bang-cat-chi-vet-thuong-thi-chi-phi-het-bao-nhieu-va-can-mang-theo-giay-to-gi-khong',
    ],
    doctors: [
      {
        doctorCode: 'SEED-SUR-01',
        academicTitle: null,
        qualification: 'BS.CKII',
        fullName: 'Lê Quốc Bình',
        bio: 'Khám ngoại tổng quát, đánh giá bệnh hậu môn trực tràng và hướng dẫn chuyển viện khi cần can thiệp ngoại khoa.',
      },
      {
        doctorCode: 'SEED-SUR-02',
        academicTitle: null,
        qualification: 'BS.CKI',
        fullName: 'Phạm Hoàng Nam',
        bio: 'Khám vết thương, thay băng, cắt chỉ và theo dõi người bệnh sau phẫu thuật theo chỉ định.',
      },
    ],
  },
  {
    code: 'SPEC-PED',
    name: 'Nhi',
    roomCode: 'P103',
    description:
      'Khám và điều trị ngoại trú các bệnh thường gặp ở trẻ em, gồm bệnh hô hấp, tiêu hóa và các vấn đề sức khỏe theo lứa tuổi. Theo dõi phát triển thể chất, tinh thần; tư vấn dinh dưỡng, chăm sóc trẻ và tiêm chủng; chuyển viện khi trẻ cần điều trị chuyên sâu.',
    sourceUrls: ['https://tamanhhospital.vn/chuyen-khoa/nhi/'],
    doctors: [
      {
        doctorCode: 'SEED-PED-01',
        academicTitle: null,
        qualification: 'TS.BS',
        fullName: 'Võ Ngọc Mai',
        bio: 'Khám các bệnh hô hấp thường gặp ở trẻ em và tư vấn chăm sóc, theo dõi trẻ tại nhà.',
      },
      {
        doctorCode: 'SEED-PED-02',
        academicTitle: null,
        qualification: 'ThS.BS',
        fullName: 'Đặng Gia Huy',
        bio: 'Khám các bệnh tiêu hóa ở trẻ, theo dõi tăng trưởng và tư vấn dinh dưỡng theo độ tuổi.',
      },
    ],
  },
  {
    code: 'SPEC-OBG',
    name: 'Sản phụ khoa',
    roomCode: 'P104',
    description:
      'Khám, tư vấn và điều trị ngoại trú các bệnh phụ khoa; tư vấn sức khỏe sinh sản. Khám và theo dõi thai kỳ trong phạm vi chuyên môn của phòng khám, phát hiện yếu tố nguy cơ và chuyển đến bệnh viện khi cần quản lý thai chuyên sâu hoặc xử trí cấp cứu sản khoa.',
    sourceUrls: [
      'https://www.vinmec.com/vie/chuyen-khoa/trung-tam-suc-khoe-phu-nu',
    ],
    doctors: [
      {
        doctorCode: 'SEED-OBG-01',
        academicTitle: null,
        qualification: 'BS.CKII',
        fullName: 'Bùi Thảo Linh',
        bio: 'Khám phụ khoa, tư vấn các vấn đề sức khỏe sinh sản và theo dõi điều trị ngoại trú.',
      },
      {
        doctorCode: 'SEED-OBG-02',
        academicTitle: null,
        qualification: 'ThS.BS',
        fullName: 'Hoàng Khánh Vy',
        bio: 'Khám thai định kỳ, theo dõi thai kỳ và nhận diện yếu tố nguy cơ cần chuyển khám tại bệnh viện.',
      },
    ],
  },
  {
    code: 'SPEC-ENT',
    name: 'Tai Mũi Họng',
    roomCode: 'P105',
    description:
      'Khám, chẩn đoán và điều trị ngoại trú các bệnh tai, mũi, họng và xoang ở người lớn, trẻ em. Đánh giá triệu chứng đau tai, nghẹt mũi, đau họng, khàn tiếng; thực hiện nội soi tai mũi họng theo chỉ định khi đáp ứng điều kiện chuyên môn và thiết bị.',
    sourceUrls: ['https://tamanhhospital.vn/chuyen-khoa/tai-mui-hong/'],
    doctors: [
      {
        doctorCode: 'SEED-ENT-01',
        academicTitle: 'ASSOCIATE_PROFESSOR',
        qualification: 'TS.BS',
        fullName: 'Đỗ Đức Khang',
        bio: 'Khám bệnh tai mũi họng người lớn, đánh giá viêm mũi xoang và theo dõi điều trị ngoại trú.',
      },
      {
        doctorCode: 'SEED-ENT-02',
        academicTitle: null,
        qualification: 'BS.CKI',
        fullName: 'Ngô Thanh Trúc',
        bio: 'Khám các vấn đề tai mũi họng ở trẻ em và hướng dẫn chăm sóc, tái khám theo diễn biến bệnh.',
      },
    ],
  },
  {
    code: 'SPEC-DER',
    name: 'Da liễu',
    roomCode: 'P106',
    description:
      'Khám và điều trị ngoại trú các bệnh về da, tóc và móng. Đánh giá, theo dõi các tình trạng như mụn trứng cá, viêm da dị ứng, chàm và mề đay; tư vấn chăm sóc da, phòng tái phát và nhận diện tổn thương cần khám chuyên sâu.',
    sourceUrls: ['https://tamanhhospital.vn/chuyen-khoa/da-lieu/'],
    doctors: [
      {
        doctorCode: 'SEED-DER-01',
        academicTitle: null,
        qualification: 'ThS.BS',
        fullName: 'Dương Hải Yến',
        bio: 'Khám mụn trứng cá, đánh giá các vấn đề da thường gặp và tư vấn chăm sóc da phù hợp.',
      },
      {
        doctorCode: 'SEED-DER-02',
        academicTitle: null,
        qualification: 'BS.CKII',
        fullName: 'Mai Tuấn Kiệt',
        bio: 'Khám viêm da, chàm, mề đay và theo dõi đáp ứng điều trị các bệnh da ngoại trú.',
      },
    ],
  },
  {
    code: 'SPEC-RHE',
    name: 'Nội cơ xương khớp',
    roomCode: 'P107',
    description:
      'Khám, điều trị nội khoa và theo dõi ngoại trú các bệnh cơ xương khớp như thoái hóa khớp, thoái hóa cột sống, loãng xương, gút và bệnh gân cơ. Đánh giá đau, viêm khớp; tư vấn vận động, theo dõi điều trị và chuyển khám chuyên sâu khi cần.',
    sourceUrls: ['https://tamanhhospital.vn/chuyen-khoa/noi-co-xuong-khop/'],
    doctors: [
      {
        doctorCode: 'SEED-RHE-01',
        academicTitle: 'ASSOCIATE_PROFESSOR',
        qualification: 'TS.BS',
        fullName: 'Tạ Minh Quân',
        bio: 'Khám thoái hóa khớp, đau cột sống và loãng xương; tư vấn vận động và theo dõi điều trị nội khoa.',
      },
      {
        doctorCode: 'SEED-RHE-02',
        academicTitle: null,
        qualification: 'BS.CKI',
        fullName: 'Lý Phương Anh',
        bio: 'Khám gút, đau viêm khớp và các bệnh gân cơ; theo dõi điều trị ngoại trú theo tình trạng bệnh.',
      },
    ],
  },
  {
    code: 'SPEC-OPH',
    name: 'Mắt',
    roomCode: 'P108',
    description:
      'Khám mắt, đánh giá thị lực, đo khúc xạ và tư vấn kính phù hợp. Khám, theo dõi các bệnh mắt như khô mắt; đo nhãn áp và đánh giá nguy cơ bệnh mắt theo chỉ định. Chuyển đến bệnh viện khi cần phẫu thuật hoặc điều trị chuyên sâu.',
    sourceUrls: [
      'https://www.fvhospital.com/health-blog-post/benh-vien-chuyen-kham-mat-va-dieu-tri-cac-benh-ly-ve-mat-dat-chuan-jci-khoa-mat-va-phau-thuat-khuc-xa-benh-vien-fv/',
    ],
    doctors: [
      {
        doctorCode: 'SEED-OPH-01',
        academicTitle: null,
        qualification: 'BS.CKII',
        fullName: 'Cao Nhật Minh',
        bio: 'Khám mắt, kiểm tra thị lực, đo khúc xạ và tư vấn điều chỉnh kính.',
      },
      {
        doctorCode: 'SEED-OPH-02',
        academicTitle: null,
        qualification: 'ThS.BS',
        fullName: 'Đinh Bảo Ngọc',
        bio: 'Khám khô mắt, đánh giá nhãn áp và theo dõi các vấn đề mắt cần tái khám định kỳ.',
      },
    ],
  },
] as const;

export async function seedClinic(prisma: PrismaClient): Promise<void> {
  assert.notEqual(
    process.env.NODE_ENV,
    'production',
    'Dữ liệu nhân sự giả lập chỉ dùng cho đồ án/dev/test. Production cần hồ sơ đã xác minh.',
  );
  const passwordHash = await hash('123456', 12);
  const now = new Date();
  assert.equal(CLINIC_SPECIALTIES.length, 8);
  assert.equal(new Set(CLINIC_SPECIALTIES.map(({ code }) => code)).size, 8);
  assert.equal(new Set(CLINIC_SPECIALTIES.map(({ name }) => name)).size, 8);
  const roomCodes = CLINIC_SPECIALTIES.map(({ roomCode }) => roomCode);
  assert.equal(new Set(roomCodes).size, 8);
  const doctors = CLINIC_SPECIALTIES.flatMap(({ doctors }) => [...doctors]);
  assert.equal(doctors.length, 16);
  assert.equal(new Set(doctors.map(({ doctorCode }) => doctorCode)).size, 16);
  for (const specialty of CLINIC_SPECIALTIES) {
    assert.equal(specialty.doctors.length, 2);
    assert.ok(specialty.description.trim());
    assert.ok(specialty.sourceUrls.length > 0);
  }

  await prisma.$transaction(
    async (transaction) => {
      const role = await transaction.role.upsert({
        where: { name: RoleEnum.DOCTOR },
        create: { name: RoleEnum.DOCTOR, description: 'Bác sĩ khám ngoại trú' },
        update: {},
      });
      assert.ok(
        role.status === 'ACTIVE' && role.deletedAt === null,
        'Vai trò DOCTOR đang bị vô hiệu hóa.',
      );

      for (const entry of CLINIC_SPECIALTIES) {
        const specialty = await transaction.specialty.upsert({
          where: { code: entry.code },
          create: {
            code: entry.code,
            name: entry.name,
            roomCode: entry.roomCode,
            description: entry.description,
          },
          update: {},
        });
        assert.equal(specialty.name, entry.name, `Trùng mã khoa ${entry.code}`);
        assert.equal(
          specialty.roomCode,
          entry.roomCode,
          `Khoa ${entry.code} đã được gán phòng khác.`,
        );

        for (const doctorEntry of entry.doctors) {
          const email = `${doctorEntry.doctorCode.toLowerCase()}@example.invalid`;
          const doctor = await transaction.doctor.upsert({
            where: { doctorCode: doctorEntry.doctorCode },
            create: {
              doctorCode: doctorEntry.doctorCode,
              licenseNumber: `DEMO-${doctorEntry.doctorCode}`,
              academicTitle: doctorEntry.academicTitle,
              qualification: doctorEntry.qualification,
              specialty: { connect: { id: specialty.id } },
              bio: `Hồ sơ bác sĩ giả lập dùng cho dữ liệu mẫu. Phạm vi khám mô phỏng: ${doctorEntry.bio}`,
              user: {
                create: {
                  fullName: doctorEntry.fullName,
                  email,
                  roleId: role.id,
                  passwordHash,
                  passwordChangedAt: now,
                  status: 'ACTIVE',
                  emailVerifiedAt: now,
                },
              },
            },
            update: {},
            include: { user: true },
          });
          assert.equal(
            doctor.specialtyId,
            specialty.id,
            `Bác sĩ ${doctorEntry.doctorCode} đã thuộc khoa khác.`,
          );
          assert.equal(doctor.user.email, email, 'Trùng mã bác sĩ đã có.');
          assert.equal(doctor.user.roleId, role.id, 'Sai vai trò bác sĩ.');
          // Upgrade old passwordless demo accounts without resetting a changed password or unlocking users.
          await transaction.user.updateMany({
            where: {
              id: doctor.userId,
              status: 'PENDING_VERIFICATION',
              passwordHash: null,
              passwordChangedAt: null,
              deletedAt: null,
              authIdentities: { none: {} },
              authSessions: { none: {} },
            },
            data: {
              passwordHash,
              passwordChangedAt: now,
              status: 'ACTIVE',
              emailVerifiedAt: now,
            },
          });
          // Backfill the previous demo seed without replacing edited qualifications.
          await transaction.doctor.updateMany({
            where: {
              id: doctor.id,
              licenseNumber: `DEMO-${doctorEntry.doctorCode}`,
              academicTitle: null,
              qualification: null,
            },
            data: {
              academicTitle: doctorEntry.academicTitle,
              qualification: doctorEntry.qualification,
            },
          });
        }
      }

      const specialties = await transaction.specialty.findMany({
        where: { roomCode: { in: roomCodes } },
        include: { _count: { select: { doctors: true } } },
      });
      assert.equal(
        specialties.length,
        8,
        'Mỗi phòng phải thuộc đúng một khoa.',
      );
      for (const specialty of specialties) {
        assert.equal(
          specialty._count.doctors,
          2,
          `Khoa ${specialty.code} phải có đúng hai bác sĩ.`,
        );
      }
    },
    { timeout: 30000 },
  );
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const schema =
    new URL(connectionString).searchParams.get('schema') || 'public';
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, connectionTimeoutMillis: 5000 },
      { schema },
    ),
  });
  try {
    await seedClinic(prisma);
    console.log(
      'Đã seed 8 chuyên khoa, 8 phòng và 16 bác sĩ giả lập. Tài khoản mới ACTIVE, đã xác minh email, mật khẩu demo: 123456. Mật khẩu đã đổi được giữ nguyên.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : 'Clinic seed failed',
    );
    process.exitCode = 1;
  });
}
