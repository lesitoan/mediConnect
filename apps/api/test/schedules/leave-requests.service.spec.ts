import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  LeaveRequestPriority,
  LeaveRequestStatus,
  LeaveRequestType,
} from '../../src/generated/prisma/enums';
import { CreateLeaveRequestDto } from '../../src/modules/schedules/dto/staff/create-leave-request.dto';
import { RejectLeaveRequestDto } from '../../src/modules/schedules/dto/admin/reject-leave-request.dto';
import { validateBody } from '../helpers/validation.helpers';
import {
  ADMIN,
  DOCTOR,
  DOCTOR_ID,
  NOW,
  REPLACEMENT_ID,
  REQUEST_ID,
  SCHEDULE_ID,
  USER_ID,
  createSchedulesHarness,
  leaveInput,
} from './schedules-test.helpers';

const HOUR_MS = 3_600_000;

describe('UC05 - Nghỉ có kế hoạch, báo vắng và xét duyệt', () => {
  let harness: ReturnType<typeof createSchedulesHarness>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    harness = createSchedulesHarness();
  });

  afterEach(() => jest.useRealTimers());

  function approve() {
    return harness.service.approveLeaveRequest(
      REQUEST_ID,
      { replacementDoctorId: REPLACEMENT_ID },
      ADMIN,
    );
  }

  function reject(reason = 'Không đủ nhân sự thay thế') {
    return harness.service.rejectLeaveRequest(
      REQUEST_ID,
      { rejectionReason: reason },
      ADMIN,
    );
  }

  function expectNoLeaveWrites() {
    expect(harness.repository.createLeaveRequest).not.toHaveBeenCalled();
    expect(
      harness.repository.createLeaveRequestSchedules,
    ).not.toHaveBeenCalled();
    expect(harness.audit.record).not.toHaveBeenCalled();
  }

  function expectNoReviewWrites() {
    expect(harness.repository.updateLeaveRequest).not.toHaveBeenCalled();
    expect(harness.repository.markStaffSchedulesAbsent).not.toHaveBeenCalled();
    expect(harness.repository.markDoctorSchedulesAbsent).not.toHaveBeenCalled();
    expect(harness.repository.createScheduleException).not.toHaveBeenCalled();
    expect(
      harness.repository.createScheduleReassignment,
    ).not.toHaveBeenCalled();
    expect(harness.audit.record).not.toHaveBeenCalled();
  }

  describe('Mốc báo trước 48 giờ', () => {
    it.each([
      [
        'UT05_NOTICE_001',
        'Báo trước 47 giờ 59 phút',
        NOW.toISOString(),
        48 * HOUR_MS - 60_000,
        false,
      ],
      [
        'UT05_NOTICE_002',
        'Báo trước đúng 48 giờ',
        NOW.toISOString(),
        48 * HOUR_MS,
        true,
      ],
      [
        'UT05_NOTICE_003',
        'Báo trước 48 giờ 01 phút',
        NOW.toISOString(),
        48 * HOUR_MS + 60_000,
        true,
      ],
      [
        'UT05_NOTICE_004',
        'Thấp hơn 48 giờ một mili giây',
        NOW.toISOString(),
        48 * HOUR_MS - 1,
        false,
      ],
      [
        'UT05_NOTICE_005',
        'Cao hơn 48 giờ một mili giây',
        NOW.toISOString(),
        48 * HOUR_MS + 1,
        true,
      ],
      [
        'UT05_NOTICE_006',
        'Tính tới đầu ca thay vì cuối ca',
        NOW.toISOString(),
        48 * HOUR_MS - 60_000,
        false,
      ],
      [
        'UT05_NOTICE_007',
        'Mốc báo trước đi qua cuối tuần',
        '2026-11-06T08:00:00+07:00',
        72 * HOUR_MS,
        true,
      ],
      [
        'UT05_NOTICE_008',
        'Hai biểu diễn múi giờ của cùng thời điểm',
        '2026-11-02T01:00:00Z',
        48 * HOUR_MS,
        true,
      ],
    ] as const)(
      '%s - %s',
      async (_id, _description, now, interval, isPlanned) => {
        jest.setSystemTime(new Date(now));
        const startsAt = new Date(Date.now() + interval);
        const input = {
          ...leaveInput(),
          startsAt: startsAt.toISOString(),
          endsAt: new Date(startsAt.getTime() + 4 * HOUR_MS).toISOString(),
        };
        if (!isPlanned) {
          await expect(
            harness.service.createLeaveRequest(input, DOCTOR),
          ).rejects.toThrow('Planned leave requires at least 48 hours notice');
          expectNoLeaveWrites();
        } else {
          await expect(
            harness.service.createLeaveRequest(input, DOCTOR),
          ).resolves.toMatchObject({ id: REQUEST_ID });
          expect(harness.repository.createLeaveRequest).toHaveBeenCalledWith(
            harness.client,
            expect.objectContaining({
              startsAt,
              noticeHours: interval >= 72 * HOUR_MS ? 72 : 48,
              requestType: LeaveRequestType.PLANNED_LEAVE,
              priority: LeaveRequestPriority.NORMAL,
            }),
          );
        }
        if (_id === 'UT05_NOTICE_008') {
          harness.repository.createLeaveRequest.mockClear();
          jest.setSystemTime(new Date('2026-11-02T08:00:00+07:00'));
          await harness.service.createLeaveRequest(input, DOCTOR);
          expect(harness.repository.createLeaveRequest).toHaveBeenCalledWith(
            harness.client,
            expect.objectContaining({ startsAt, noticeHours: 48 }),
          );
        }
      },
    );

    it.each([
      ['UT05_NOTICE_009', 'Thiếu thời điểm đầu ca', undefined],
      ['UT05_NOTICE_010', 'Thời điểm đầu ca không hợp lệ', 'invalid-date'],
    ])('%s - %s', async (_id, _description, startsAt) => {
      await expect(
        validateBody(CreateLeaveRequestDto, { ...leaveInput(), startsAt }),
      ).rejects.toThrow(BadRequestException);
      expectNoLeaveWrites();
    });

    it('UT05_NOTICE_011 - Không thao tác ca thuộc bác sĩ khác', async () => {
      // The repository scopes schedules to the requester; D2's schedules are not returned.
      harness.repository.findOverlappingWorkSchedules.mockResolvedValue([]);
      await expect(
        harness.service.createLeaveRequest(leaveInput(), DOCTOR),
      ).rejects.toThrow(BadRequestException);
      expect(
        harness.repository.findOverlappingWorkSchedules,
      ).toHaveBeenCalledWith(
        USER_ID,
        new Date(leaveInput().startsAt),
        new Date(leaveInput().endsAt),
      );
      expectNoLeaveWrites();
    });

    it('UT05_NOTICE_012 - Không tạo đơn có kế hoạch khi dưới ngưỡng', async () => {
      await expect(
        harness.service.createLeaveRequest(
          { ...leaveInput(), startsAt: '2026-11-04T07:59:00+07:00' },
          DOCTOR,
        ),
      ).rejects.toThrow(BadRequestException);
      expectNoLeaveWrites();
    });

    it.each([
      ['UT05_NOTICE_013', 'Thiếu lý do nghỉ có kế hoạch', undefined],
      ['UT05_NOTICE_014', 'Lý do nghỉ có kế hoạch là null', null],
      ['UT05_NOTICE_015', 'Lý do nghỉ có kế hoạch rỗng', ''],
      ['UT05_NOTICE_016', 'Lý do nghỉ chỉ có khoảng trắng', ' \t\n '],
      ['UT05_URGENT_003', 'Thiếu lý do báo vắng', undefined],
      ['UT05_URGENT_004', 'Lý do báo vắng là null', null],
      ['UT05_URGENT_005', 'Lý do báo vắng rỗng', ''],
      ['UT05_URGENT_006', 'Lý do báo vắng chỉ có khoảng trắng', ' \t\n '],
    ])('%s - %s', async (id, _description, reason) => {
      const requestType = id.includes('URGENT')
        ? LeaveRequestType.URGENT_ABSENCE
        : LeaveRequestType.PLANNED_LEAVE;
      await expect(
        validateBody(CreateLeaveRequestDto, {
          ...leaveInput(),
          requestType,
          reason,
        }),
      ).rejects.toThrow(BadRequestException);
      expectNoLeaveWrites();
    });
  });

  describe('Báo vắng khẩn', () => {
    it.each([
      [
        'UT05_URGENT_001',
        'Báo vắng cho ca sắp bắt đầu trong ngày',
        '2026-11-02T08:00:00+07:00',
      ],
      [
        'UT05_URGENT_002',
        'Báo vắng cho ca đang diễn ra',
        '2026-11-02T10:00:00+07:00',
      ],
    ])('%s - %s', async (_id, _description, now) => {
      jest.setSystemTime(new Date(now));
      await harness.service.createLeaveRequest(
        {
          ...leaveInput(),
          requestType: LeaveRequestType.URGENT_ABSENCE,
          startsAt: '2026-11-02T09:00:00+07:00',
          endsAt: '2026-11-02T12:00:00+07:00',
        },
        DOCTOR,
      );
      expect(harness.repository.createLeaveRequest).toHaveBeenCalledWith(
        harness.client,
        expect.objectContaining({
          staffUserId: USER_ID,
          doctorId: DOCTOR_ID,
          requestType: LeaveRequestType.URGENT_ABSENCE,
          priority: LeaveRequestPriority.URGENT,
          status: LeaveRequestStatus.PENDING,
        }),
      );
      expect(
        harness.repository.markStaffSchedulesAbsent,
      ).not.toHaveBeenCalled();
    });

    it('UT05_URGENT_008 - Có bệnh nhân đã check-in phải kích hoạt UC11', async () => {
      harness.repository.findAffectedCareSessions.mockResolvedValue([
        { id: 'care-1', appointmentId: 'appointment-1', status: 'CHECKED_IN' },
      ]);
      await harness.service.createLeaveRequest(
        {
          ...leaveInput(),
          requestType: LeaveRequestType.URGENT_ABSENCE,
          startsAt: '2026-11-02T09:00:00+07:00',
          endsAt: '2026-11-02T12:00:00+07:00',
        },
        DOCTOR,
      );
      expect(harness.repository.createScheduleException).toHaveBeenCalledWith(
        harness.client,
        expect.objectContaining({
          leaveRequestId: REQUEST_ID,
          careSessionId: 'care-1',
          originalDoctorId: DOCTOR_ID,
        }),
      );
    });

    it('UT05_URGENT_010 - Không tìm thấy ca báo vắng', async () => {
      harness.repository.findOverlappingWorkSchedules.mockResolvedValue([]);
      await expect(
        harness.service.createLeaveRequest(
          {
            ...leaveInput(),
            requestType: LeaveRequestType.URGENT_ABSENCE,
            startsAt: '2026-11-02T09:00:00+07:00',
            endsAt: '2026-11-02T12:00:00+07:00',
          },
          DOCTOR,
        ),
      ).rejects.toThrow('No work schedule exists in the requested range');
      expectNoLeaveWrites();
      expect(harness.repository.createScheduleException).not.toHaveBeenCalled();
    });

    it.todo(
      'UT05_URGENT_007 - Thông báo khẩn đến Admin: SchedulesService chưa có phụ thuộc thông báo',
    );
    it.todo(
      'UT05_URGENT_009 - Danh sách bệnh nhân gửi Admin: chưa có hợp đồng thông báo ảnh hưởng',
    );
  });

  describe('Trạng thái đơn', () => {
    it('UT05_STATE_001 - Gửi nghỉ có kế hoạch tạo trạng thái chờ', async () => {
      await harness.service.createLeaveRequest(leaveInput(), DOCTOR);
      expect(harness.repository.createLeaveRequest).toHaveBeenCalledWith(
        harness.client,
        expect.objectContaining({
          status: LeaveRequestStatus.PENDING,
          requestType: LeaveRequestType.PLANNED_LEAVE,
        }),
      );
      expect(
        harness.repository.createLeaveRequestSchedules,
      ).toHaveBeenCalledWith(harness.client, [
        { leaveRequestId: REQUEST_ID, staffWorkScheduleId: SCHEDULE_ID },
      ]);
      expect(
        harness.repository.markStaffSchedulesAbsent,
      ).not.toHaveBeenCalled();
      expect(
        harness.repository.markDoctorSchedulesAbsent,
      ).not.toHaveBeenCalled();
      expect(harness.repository.createScheduleException).not.toHaveBeenCalled();
    });

    it.todo(
      'UT05_STATE_002 - Chưa xác nhận hai lịch hẹn ảnh hưởng: CreateLeaveRequestDto chưa có bước xác nhận',
    );
    it.todo(
      'UT05_STATE_003 - Xác nhận lịch hẹn ảnh hưởng: chưa có token/snapshot xác nhận trong DTO',
    );

    it.each([
      [
        'UT05_STATE_004',
        'Duyệt đơn nghỉ đang chờ',
        LeaveRequestType.PLANNED_LEAVE,
        LeaveRequestPriority.NORMAL,
      ],
      [
        'UT05_STATE_005',
        'Duyệt báo vắng khẩn đang chờ',
        LeaveRequestType.URGENT_ABSENCE,
        LeaveRequestPriority.URGENT,
      ],
    ])('%s - %s', async (_id, _description, requestType, priority) => {
      harness.repository.findLeaveRequest.mockResolvedValue({
        ...harness.request,
        requestType,
        priority,
      });
      await approve();
      expect(harness.repository.updateLeaveRequest).toHaveBeenCalledWith(
        harness.client,
        REQUEST_ID,
        {
          status: LeaveRequestStatus.APPROVED,
          reviewedBy: ADMIN.id,
          reviewedAt: NOW,
        },
      );
      expect(harness.repository.markStaffSchedulesAbsent).toHaveBeenCalledWith(
        harness.client,
        [SCHEDULE_ID],
      );
      expect(harness.repository.markDoctorSchedulesAbsent).toHaveBeenCalledWith(
        harness.client,
        DOCTOR_ID,
        harness.request.startsAt,
        harness.request.endsAt,
      );
    });

    it.each([
      [
        'UT05_STATE_006',
        'Đã duyệt không được duyệt lần nữa',
        LeaveRequestStatus.APPROVED,
        'APPROVE',
      ],
      [
        'UT05_STATE_007',
        'Đã từ chối không được duyệt',
        LeaveRequestStatus.REJECTED,
        'APPROVE',
      ],
      [
        'UT05_STATE_008',
        'Đã hủy không được duyệt',
        LeaveRequestStatus.CANCELLED,
        'APPROVE',
      ],
      [
        'UT05_STATE_009',
        'Đã duyệt không được từ chối',
        LeaveRequestStatus.APPROVED,
        'REJECT',
      ],
      [
        'UT05_STATE_010',
        'Đã từ chối không được xử lý lại',
        LeaveRequestStatus.REJECTED,
        'REJECT',
      ],
      [
        'UT05_STATE_011',
        'Đã hủy không được từ chối',
        LeaveRequestStatus.CANCELLED,
        'REJECT',
      ],
    ])('%s - %s', async (_id, _description, status, action) => {
      harness.repository.findLeaveRequest.mockResolvedValue({
        ...harness.request,
        status,
        rejectionReason: 'Lý do cũ',
      });
      await expect(action === 'APPROVE' ? approve() : reject()).rejects.toThrow(
        ConflictException,
      );
      expectNoReviewWrites();
    });

    it('UT05_STATE_012 - Không tìm thấy yêu cầu cần duyệt', async () => {
      harness.repository.findLeaveRequest.mockResolvedValue(null);
      await expect(approve()).rejects.toThrow(NotFoundException);
      expectNoReviewWrites();
    });

    it.todo(
      'UT05_STATE_013 - Ca bị sửa khi đơn đang chờ: chưa lưu version/snapshot ca lúc gửi đơn',
    );

    it('UT05_STATE_014 - Ca đã hủy không được đổi thành Vắng', async () => {
      harness.repository.findLeaveRequest.mockResolvedValue({
        ...harness.request,
        scheduleLinks: [
          {
            staffWorkScheduleId: SCHEDULE_ID,
            staffWorkSchedule: { ...harness.schedule, status: 'CANCELLED' },
          },
        ],
      });
      await expect(approve()).rejects.toThrow(ConflictException);
      expectNoReviewWrites();
    });

    it('UT05_STATE_015 - Duyệt ca xử lý đúng hai lịch hẹn ảnh hưởng', async () => {
      harness.repository.findAffectedCareSessions.mockResolvedValue([
        {
          id: 'care-1',
          appointmentId: 'appointment-1',
          appointmentSlotId: 'slot-1',
          status: 'CHECKED_IN',
        },
        {
          id: 'care-2',
          appointmentId: 'appointment-2',
          appointmentSlotId: 'slot-2',
          status: 'CONFIRMED',
        },
      ]);
      harness.repository.createScheduleException
        .mockResolvedValueOnce({ id: 'exception-1' })
        .mockResolvedValueOnce({ id: 'exception-2' });
      await approve();
      expect(harness.repository.findAffectedCareSessions).toHaveBeenCalledWith(
        DOCTOR_ID,
        harness.request.startsAt,
        harness.request.endsAt,
        harness.client,
      );
      expect(harness.repository.createScheduleException).toHaveBeenCalledTimes(
        2,
      );
      expect(
        harness.repository.createScheduleException,
      ).toHaveBeenNthCalledWith(
        1,
        harness.client,
        expect.objectContaining({
          leaveRequestId: REQUEST_ID,
          careSessionId: 'care-1',
          originalDoctorId: DOCTOR_ID,
          status: 'PENDING_REASSIGNMENT',
        }),
      );
      expect(
        harness.repository.createScheduleException,
      ).toHaveBeenNthCalledWith(
        2,
        harness.client,
        expect.objectContaining({
          leaveRequestId: REQUEST_ID,
          careSessionId: 'care-2',
          originalDoctorId: DOCTOR_ID,
          status: 'PROPOSED',
        }),
      );
      expect(
        harness.repository.createScheduleReassignment,
      ).toHaveBeenCalledTimes(2);
      expect(
        harness.repository.createScheduleReassignment,
      ).toHaveBeenNthCalledWith(
        1,
        harness.client,
        expect.objectContaining({
          exceptionId: 'exception-1',
          fromDoctorId: DOCTOR_ID,
          toDoctorId: REPLACEMENT_ID,
          fromSlotId: 'slot-1',
        }),
      );
      expect(
        harness.repository.createScheduleReassignment,
      ).toHaveBeenNthCalledWith(
        2,
        harness.client,
        expect.objectContaining({
          exceptionId: 'exception-2',
          fromDoctorId: DOCTOR_ID,
          toDoctorId: REPLACEMENT_ID,
          fromSlotId: 'slot-2',
        }),
      );
      expect(
        harness.repository.markAppointmentsPendingResolution,
      ).toHaveBeenCalledWith(harness.client, ['appointment-1']);
    });

    it('UT05_STATE_016 - Không tái phân công nếu không có lịch hẹn ảnh hưởng', async () => {
      await approve();
      expect(harness.repository.findAffectedCareSessions).toHaveBeenCalledTimes(
        1,
      );
      expect(harness.repository.createScheduleException).not.toHaveBeenCalled();
      expect(
        harness.repository.createScheduleReassignment,
      ).not.toHaveBeenCalled();
      expect(
        harness.repository.markAppointmentsPendingResolution,
      ).not.toHaveBeenCalled();
    });

    it('UT05_STATE_017 - Ghi đúng người và thời điểm duyệt', async () => {
      await approve();
      expect(harness.repository.updateLeaveRequest).toHaveBeenCalledWith(
        harness.client,
        REQUEST_ID,
        {
          status: LeaveRequestStatus.APPROVED,
          reviewedBy: ADMIN.id,
          reviewedAt: NOW,
        },
      );
      expect(harness.audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          targetId: REQUEST_ID,
          actionCode: 'LEAVE_REQUEST_APPROVED',
          actor: {
            type: 'USER',
            id: ADMIN.id,
            name: ADMIN.name,
            role: ADMIN.role,
          },
        }),
        harness.client,
      );
    });

    it.todo(
      'UT05_STATE_018 - Thông báo đúng bác sĩ sau xử lý: chưa có phụ thuộc thông báo',
    );

    it('UT05_STATE_019 - Không báo duyệt thành công nếu lưu lỗi', async () => {
      const error = new Error('Approval storage unavailable');
      harness.repository.updateLeaveRequest.mockRejectedValue(error);
      await expect(approve()).rejects.toBe(error);
      expect(
        harness.repository.markStaffSchedulesAbsent,
      ).not.toHaveBeenCalled();
      expect(harness.repository.createScheduleException).not.toHaveBeenCalled();
      expect(harness.audit.record).not.toHaveBeenCalled();
    });
  });

  describe('Lý do từ chối', () => {
    it.each([
      [
        'UT05_REJECT_001',
        'Từ chối đơn có kế hoạch',
        LeaveRequestType.PLANNED_LEAVE,
      ],
      [
        'UT05_REJECT_002',
        'Từ chối báo vắng khẩn',
        LeaveRequestType.URGENT_ABSENCE,
      ],
    ])('%s - %s', async (_id, _description, requestType) => {
      harness.repository.findLeaveRequest.mockResolvedValue({
        ...harness.request,
        requestType,
      });
      await reject();
      expect(harness.repository.updateLeaveRequest).toHaveBeenCalledWith(
        harness.client,
        REQUEST_ID,
        {
          status: LeaveRequestStatus.REJECTED,
          rejectionReason: 'Không đủ nhân sự thay thế',
          reviewedBy: ADMIN.id,
          reviewedAt: NOW,
        },
      );
      expect(
        harness.repository.markStaffSchedulesAbsent,
      ).not.toHaveBeenCalled();
      expect(
        harness.repository.markDoctorSchedulesAbsent,
      ).not.toHaveBeenCalled();
      expect(harness.repository.createScheduleException).not.toHaveBeenCalled();
    });

    it.each([
      ['UT05_REJECT_003', 'Thiếu lý do từ chối', undefined],
      ['UT05_REJECT_004', 'Lý do từ chối là null', null],
      ['UT05_REJECT_005', 'Lý do từ chối rỗng', ''],
      ['UT05_REJECT_006', 'Lý do từ chối chỉ có khoảng trắng', ' \t\n '],
    ])('%s - %s', async (_id, _description, rejectionReason) => {
      await expect(
        validateBody(RejectLeaveRequestDto, { rejectionReason }),
      ).rejects.toThrow(BadRequestException);
      expectNoReviewWrites();
    });

    it('UT05_REJECT_007 - Lưu đúng nội dung lý do tiếng Việt', async () => {
      await reject('Cần bảo đảm bác sĩ trực tại phòng khám');
      expect(harness.repository.updateLeaveRequest).toHaveBeenCalledWith(
        harness.client,
        REQUEST_ID,
        expect.objectContaining({
          status: LeaveRequestStatus.REJECTED,
          rejectionReason: 'Cần bảo đảm bác sĩ trực tại phòng khám',
        }),
      );
    });

    it('UT05_REJECT_008 - Không báo từ chối thành công khi lưu thất bại', async () => {
      const error = new Error('Rejection storage unavailable');
      harness.repository.updateLeaveRequest.mockRejectedValue(error);
      await expect(reject()).rejects.toBe(error);
      expect(harness.audit.record).not.toHaveBeenCalled();
      expect(
        harness.repository.markStaffSchedulesAbsent,
      ).not.toHaveBeenCalled();
    });
  });
});
