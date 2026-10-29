import { Prisma } from '../../../generated/prisma/client';

export function sqlTable(schemaName: string, tableName: string): Prisma.Sql {
  const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;
  return Prisma.raw(`${quote(schemaName)}.${quote(tableName)}`);
}
