import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationUtils } from '../../common/utils/pagination.utils';
import { Prisma, UserRole } from '../../generated/prisma/client';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { PrismaService } from '../database/services/prisma.service';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { ConsultationQueryDto } from './dto/patient/consultation-query.dto';
import { MedicalRecordQueryDto } from './dto/patient/medical-record-query.dto';

const CONSULTATION_CONTEXT_SELECT = {
  id: true,
  status: true,
  appointment: { select: { id: true, appointmentCode: true, status: true } },
  specialty: { select: { id: true, name: true, roomCode: true } },
  appointmentSlot: {
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      doctorSchedule: {
        select: {
          doctor: {
            select: { id: true, user: { select: { fullName: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.CareSessionSelect;

const CONSULTATION_SUMMARY_SELECT = {
  id: true,
  careSessionId: true,
  startedAt: true,
  completedAt: true,
  followUpDate: true,
  careSession: { select: CONSULTATION_CONTEXT_SELECT },
  diagnoses: {
    where: { isPrimary: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 1,
    select: { diagnosisName: true, diagnosisCode: true },
  },
} satisfies Prisma.ConsultationSelect;

const CONSULTATION_DETAIL_SELECT = {
  id: true,
  careSessionId: true,
  clinicalNotes: true,
  prescription: true,
  labOrderNotes: true,
  labResultNotes: true,
  followUpDate: true,
  startedAt: true,
  completedAt: true,
  lockedAt: true,
  createdAt: true,
  updatedAt: true,
  diagnoses: {
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      diagnosisName: true,
      diagnosisCode: true,
      isPrimary: true,
      notes: true,
    },
  },
  careSession: {
    select: {
      ...CONSULTATION_CONTEXT_SELECT,
      appointment: {
        select: {
          id: true,
          appointmentCode: true,
          status: true,
          patient: {
            select: {
              id: true,
              patientCode: true,
              fullName: true,
              dateOfBirth: true,
              gender: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ConsultationSelect;

type ConsultationContext = Prisma.CareSessionGetPayload<{
  select: typeof CONSULTATION_CONTEXT_SELECT;
}>;

function presentContext(session: ConsultationContext) {
  const { doctorSchedule, ...slot } = session.appointmentSlot;
  const { doctor } = doctorSchedule;
  return {
    doctor: { id: doctor.id, fullName: doctor.user.fullName },
    specialty: { id: session.specialty.id, name: session.specialty.name },
    slot,
    room: session.specialty.roomCode,
    careSessionStatus: session.status,
  };
}

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRecords(query: MedicalRecordQueryDto, user: CurrentUserDto) {
    this.assertPatient(user);
    const page = new PaginationUtils().extractSkipTakeFromPagination(query);
    const where: Prisma.PatientMedicalRecordWhereInput = {
      patient: { userId: user.id },
      ...(query.recordType ? { recordType: query.recordType } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction(
      [
        this.prisma.patientMedicalRecord.findMany({
          where,
          select: {
            id: true,
            recordType: true,
            name: true,
            description: true,
            reaction: true,
            severity: true,
            status: true,
            confirmedAt: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: page.skip,
          take: page.take,
        }),
        this.prisma.patientMedicalRecord.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return {
      items,
      pagination: page.convertPaginationResponseDtoFromTotalRecords(total),
    };
  }

  async listConsultations(query: ConsultationQueryDto, user: CurrentUserDto) {
    const where = this.consultationWhere(user);
    if (
      !!query.startDate !== !!query.endDate ||
      (query.startDate && query.endDate && query.startDate > query.endDate)
    )
      throw new BadRequestException(
        'Ngày bắt đầu và kết thúc phải có cùng nhau, theo thứ tự hợp lệ.',
      );
    if (query.startDate && query.endDate) {
      const end = new Date(`${query.endDate}T00:00:00+07:00`);
      where.startedAt = {
        gte: new Date(`${query.startDate}T00:00:00+07:00`),
        lt: new Date(end.getTime() + 86_400_000),
      };
    }
    const page = new PaginationUtils().extractSkipTakeFromPagination(query);
    const [records, total] = await this.prisma.$transaction(
      [
        this.prisma.consultation.findMany({
          where,
          select: CONSULTATION_SUMMARY_SELECT,
          orderBy: [
            { startedAt: { sort: 'desc', nulls: 'last' } },
            { id: 'desc' },
          ],
          skip: page.skip,
          take: page.take,
        }),
        this.prisma.consultation.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return {
      items: records.map(
        ({ careSession, diagnoses, followUpDate, ...record }) => ({
          ...record,
          appointmentId: careSession.appointment.id,
          appointmentCode: careSession.appointment.appointmentCode,
          careSessionStatus: careSession.status,
          doctor: presentContext(careSession).doctor,
          specialty: {
            id: careSession.specialty.id,
            name: careSession.specialty.name,
          },
          primaryDiagnosis: diagnoses[0] ?? null,
          followUpDate: followUpDate?.toISOString().slice(0, 10) ?? null,
        }),
      ),
      pagination: page.convertPaginationResponseDtoFromTotalRecords(total),
    };
  }

  async getConsultation(id: string, user: CurrentUserDto) {
    const consultation = await this.prisma.consultation.findFirst({
      where: { ...this.consultationWhere(user), id },
      select: CONSULTATION_DETAIL_SELECT,
    });
    if (!consultation)
      throw new NotFoundException(
        'Không tìm thấy hồ sơ khám đã hoàn tất của bạn.',
      );
    const { careSession, followUpDate, ...data } = consultation;
    const { patient, ...appointment } = careSession.appointment;
    return {
      ...data,
      appointment,
      patient: {
        ...patient,
        dateOfBirth: patient.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      },
      ...presentContext(careSession),
      followUpDate: followUpDate?.toISOString().slice(0, 10) ?? null,
    };
  }

  private consultationWhere(
    user: CurrentUserDto,
  ): Prisma.ConsultationWhereInput {
    this.assertPatient(user);
    return {
      lockedAt: { not: null },
      careSession: {
        status: 'COMPLETED',
        appointment: { patient: { userId: user.id } },
      },
    };
  }

  private assertPatient(user: CurrentUserDto) {
    if (
      user.role !== UserRole.PATIENT ||
      !user.permissions.includes(PermissionEnum.MEDICAL_RECORDS_READ_ME)
    )
      throw new ForbiddenException('Không có quyền xem hồ sơ bệnh án cá nhân.');
  }
}
