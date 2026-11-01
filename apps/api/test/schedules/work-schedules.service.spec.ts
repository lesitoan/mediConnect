import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  StaffType,
  StaffWorkScheduleStatus,
} from '../../src/generated/prisma/enums';
import type { AuditLogsService } from '../../src/modules/audit-logs/audit-logs.service';
import type { PrismaService } from '../../src/modules/database/services/prisma.service';
import { SchedulesRepository } from '../../src/modules/schedules/schedules.repository';
import { SchedulesService } from '../../src/modules/schedules/schedules.service';
import {
  ADMIN,
  OTHER_USER_ID,
  USER_ID,
  workSchedule,
} from './schedules-test.helpers';

describe('UC05 - Trùng lịch và giờ làm việc', () => {
  function createHarness() {
    const db = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: USER_ID,
          role: { name: StaffType.DOCTOR },
          status: 'ACTIVE',
          deletedAt: null,
        }),
      },
      staffWorkSchedule: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(workSchedule()),
      },
    };
    const repository = new SchedulesRepository(db as unknown as PrismaService);
    const service = new SchedulesService(repository, {} as AuditLogsService);
    return { db, service };
  }

  function scheduleInput(
    start: string,
    end: string,
    date = '2026-11-02',
    dayOfWeek = 1,
  ) {
    return {
      staffUserId: USER_ID,
      staffType: StaffType.DOCTOR,
      startsAt: `${date}T${start}:00+07:00`,
      endsAt: `${date}T${end}:00+07:00`,
      dayOfWeek,
      effectiveFrom: `${date}T00:00:00+07:00`,
      slotDurationMinutes: 30,
    };
  }

  it.each([
    [
      'UT05_OVERLAP_001',
      'Hai ca trùng hoàn toàn',
      '08:00',
      '12:00',
      '08:00',
      '12:00',
      true,
    ],
    [
      'UT05_OVERLAP_002',
      'Ca mới nằm trong ca cũ',
      '09:00',
      '11:00',
      '08:00',
      '12:00',
      true,
    ],
    [
      'UT05_OVERLAP_003',
      'Ca mới bao phủ ca cũ',
      '07:00',
      '13:00',
      '08:00',
      '12:00',
      true,
    ],
    [
      'UT05_OVERLAP_004',
      'Trùng một phần ở đầu ca cũ',
      '07:00',
      '09:00',
      '08:00',
      '12:00',
      true,
    ],
    [
      'UT05_OVERLAP_005',
      'Trùng một phần ở cuối ca cũ',
      '11:00',
      '15:00',
      '08:00',
      '12:00',
      true,
    ],
    [
      'UT05_OVERLAP_006',
      'Ca mới hoàn toàn trước ca cũ',
      '07:00',
      '09:00',
      '10:00',
      '12:00',
      false,
    ],
    [
      'UT05_OVERLAP_007',
      'Ca mới hoàn toàn sau ca cũ',
      '13:00',
      '17:00',
      '08:00',
      '12:00',
      false,
    ],
    [
      'UT05_OVERLAP_008',
      'Ca mới bắt đầu đúng lúc ca cũ kết thúc',
      '12:00',
      '15:00',
      '08:00',
      '12:00',
      false,
    ],
    [
      'UT05_OVERLAP_009',
      'Ca mới kết thúc đúng lúc ca cũ bắt đầu',
      '07:00',
      '08:00',
      '08:00',
      '12:00',
      false,
    ],
    [
      'UT05_OVERLAP_010',
      'Hai bác sĩ khác nhau cùng giờ',
      '08:00',
      '12:00',
      '08:00',
      '12:00',
      false,
    ],
  ] as const)(
    '%s - %s',
    async (id, _description, start, end, oldStart, oldEnd, isConflict) => {
      const { db, service } = createHarness();
      const input = scheduleInput(start, end);
      const existing = {
        ...workSchedule(),
        staffUserId: id === 'UT05_OVERLAP_010' ? OTHER_USER_ID : USER_ID,
        startsAt: new Date(`2026-11-02T${oldStart}:00+07:00`),
        endsAt: new Date(`2026-11-02T${oldEnd}:00+07:00`),
      };
      // Prisma owns interval matching; test its query contract and the service's decision.
      db.staffWorkSchedule.findMany.mockResolvedValue(
        isConflict ? [existing] : [],
      );
      if (isConflict) {
        await expect(service.createWorkSchedule(input, ADMIN)).rejects.toThrow(
          ConflictException,
        );
        expect(db.staffWorkSchedule.create).not.toHaveBeenCalled();
      } else {
        await expect(
          service.createWorkSchedule(input, ADMIN),
        ).resolves.toMatchObject({ id: workSchedule().id });
        expect(db.staffWorkSchedule.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            staffUserId: USER_ID,
            startsAt: new Date(input.startsAt),
            endsAt: new Date(input.endsAt),
            createdBy: ADMIN.id,
            slotDurationMinutes: 30,
          }) as unknown,
        });
      }
      expect(db.staffWorkSchedule.findMany).toHaveBeenCalledWith({
        where: {
          staffUserId: USER_ID,
          startsAt: { lt: new Date(input.endsAt) },
          endsAt: { gt: new Date(input.startsAt) },
          status: {
            in: [
              StaffWorkScheduleStatus.DRAFT,
              StaffWorkScheduleStatus.PUBLISHED,
            ],
          },
        },
      });
    },
  );

  it.todo(
    'UT05_OVERLAP_011 - Sửa ca không so với chính nó: chưa có thao tác sửa ca trong service/controller',
  );
  it.todo(
    'UT05_OVERLAP_012 - Sửa ca giao với ca khác: chưa có thao tác sửa ca trong service/controller',
  );

  it.each([
    ['UT05_OVERLAP_013', 'Đầu ca bằng cuối ca', '08:00', '08:00'],
    ['UT05_OVERLAP_014', 'Đầu ca sau cuối ca', '12:00', '08:00'],
  ])('%s - %s', async (_id, _description, start, end) => {
    const { db, service } = createHarness();
    await expect(
      service.createWorkSchedule(scheduleInput(start, end), ADMIN),
    ).rejects.toThrow(BadRequestException);
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.staffWorkSchedule.create).not.toHaveBeenCalled();
  });

  it('UT05_OVERLAP_015 - Ca nằm đúng hai biên giờ mở cửa', async () => {
    const { db, service } = createHarness();
    const input = scheduleInput('07:00', '18:00');
    await expect(
      service.createWorkSchedule(input, ADMIN),
    ).resolves.toMatchObject({ id: workSchedule().id });
    expect(db.staffWorkSchedule.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
      }) as unknown,
    });
  });

  it.each([
    [
      'UT05_OVERLAP_016',
      'Ca bắt đầu trước 07:00',
      '06:59',
      '08:00',
      '2026-11-02',
      1,
    ],
    [
      'UT05_OVERLAP_017',
      'Ca kết thúc sau 18:00',
      '17:00',
      '18:01',
      '2026-11-02',
      1,
    ],
    [
      'UT05_OVERLAP_018',
      'Không nhận ca thứ Bảy',
      '07:00',
      '12:00',
      '2026-11-07',
      6,
    ],
    [
      'UT05_OVERLAP_019',
      'Không nhận ca Chủ nhật',
      '07:00',
      '12:00',
      '2026-11-08',
      7,
    ],
  ] as const)(
    '%s - %s',
    async (_id, _description, start, end, date, dayOfWeek) => {
      const { db, service } = createHarness();
      await expect(
        service.createWorkSchedule(
          scheduleInput(start, end, date, dayOfWeek),
          ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(db.staffWorkSchedule.create).not.toHaveBeenCalled();
    },
  );
});
