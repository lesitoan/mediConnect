import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../database/services/prisma.service';
import { sqlTable } from '../database/utils/sql-table';
import { AvailabilityQueryDto } from './dto/availability-query.dto';

export function clinicDateStart(value: string): Date {
  const date = new Date(`${value}T00:00:00+07:00`);
  if (
    !Number.isFinite(date.getTime()) ||
    new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10) !== value
  )
    throw new BadRequestException('Ngày tra cứu không hợp lệ.');
  return date;
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async availability(query: AvailabilityQueryDto) {
    const from = clinicDateStart(query.dateFrom);
    const until = new Date(clinicDateStart(query.dateTo).getTime() + 86400000);
    if (until <= from || until.getTime() - from.getTime() > 31 * 86400000)
      throw new BadRequestException('Khoảng tra cứu phải từ 1 đến 31 ngày.');
    const now = new Date();
    const hours = { MORNING: [0, 12], AFTERNOON: [12, 18], EVENING: [18, 24] };
    const [startHour, endHour] = query.timePeriod
      ? hours[query.timePeriod]
      : [0, 24];
    type SlotResult = {
      id: string;
      startsAt: string;
      endsAt: string;
      doctor: {
        id: string;
        fullName: string;
        specialty: { id: string; name: string; roomCode: string };
      };
    };
    // One statement keeps the page and count on the same database snapshot.
    const [result] = await this.prisma.$queryRaw<
      { items: SlotResult[]; total: number }[]
    >(Prisma.sql`
      WITH available AS (
        SELECT s.id, s.starts_at AS "startsAt", s.ends_at AS "endsAt",
          jsonb_build_object('id', d.id, 'fullName', u.full_name, 'specialty',
            jsonb_build_object('id', sp.id, 'name', sp.name, 'roomCode', sp.room_code)) AS doctor
        FROM ${sqlTable(this.prisma.schemaName, 'appointment_slots')} s
        JOIN ${sqlTable(this.prisma.schemaName, 'doctor_schedules')} ds ON ds.id = s.doctor_schedule_id
        JOIN ${sqlTable(this.prisma.schemaName, 'doctors')} d ON d.id = ds.doctor_id
        JOIN ${sqlTable(this.prisma.schemaName, 'users')} u ON u.id = d.user_id
        JOIN ${sqlTable(this.prisma.schemaName, 'specialties')} sp ON sp.id = d.specialty_id
        WHERE s.starts_at >= ${from} AND s.starts_at < ${until} AND s.starts_at > ${now}
          AND s.starts_at >= ds.starts_at AND s.ends_at <= ds.ends_at
          AND s.is_blocked = false AND ds.status = 'PUBLISHED'
          AND d.is_active = true AND sp.is_active = true AND u.status = 'ACTIVE' AND u.deleted_at IS NULL
          ${query.specialtyId ? Prisma.sql`AND sp.id = ${query.specialtyId}::uuid` : Prisma.empty}
          ${query.doctorId ? Prisma.sql`AND d.id = ${query.doctorId}::uuid` : Prisma.empty}
          AND EXTRACT(HOUR FROM s.starts_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= ${startHour}
          AND EXTRACT(HOUR FROM s.starts_at AT TIME ZONE 'Asia/Ho_Chi_Minh') < ${endHour}
          AND NOT EXISTS (SELECT 1 FROM ${sqlTable(this.prisma.schemaName, 'leave_requests')} l WHERE l.doctor_id = d.id
            AND l.status = 'APPROVED' AND l.starts_at < s.ends_at AND l.ends_at > s.starts_at)
          AND NOT EXISTS (SELECT 1 FROM ${sqlTable(this.prisma.schemaName, 'care_sessions')} cs
            JOIN ${sqlTable(this.prisma.schemaName, 'appointments')} a ON a.id = cs.appointment_id
            WHERE cs.appointment_slot_id = s.id AND cs.status NOT IN ('CANCELLED', 'NO_SHOW') AND a.status <> 'CANCELLED')
      ), paged AS (
        SELECT * FROM available ORDER BY "startsAt", id LIMIT ${query.limit} OFFSET ${(query.page - 1) * query.limit}
      )
      SELECT (SELECT count(*)::int FROM available) AS total,
        COALESCE((SELECT jsonb_agg(to_jsonb(paged) ORDER BY "startsAt", id) FROM paged), '[]'::jsonb) AS items
    `);
    return {
      ...result,
      page: query.page,
      limit: query.limit,
      timeZone: 'Asia/Ho_Chi_Minh',
      checkedAt: now.toISOString(),
    };
  }
}
