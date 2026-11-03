import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/services/prisma.service';
import { PaginationUtils } from '../../common/utils/pagination.utils';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { DoctorDetailQueryDto } from './dto/admin/doctor-detail-query.dto';

@Injectable()
export class DoctorDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(id: string, query: DoctorDetailQueryDto, actor: CurrentUserDto) {
    const permission =
      query.tab === 'SCHEDULE'
        ? PermissionEnum.SCHEDULES_READ
        : query.tab === 'HISTORY'
          ? PermissionEnum.APPOINTMENTS_READ
          : PermissionEnum.DOCTORS_READ;
    if (
      actor.role !== 'ADMIN' ||
      !actor.permissions.includes(PermissionEnum.DOCTORS_READ) ||
      !actor.permissions.includes(permission)
    )
      throw new ForbiddenException();
    const page = new PaginationUtils().extractSkipTakeFromPagination(query);
    return this.prisma.$transaction(
      async (tx) => {
        const doctor = await tx.doctor.findUnique({
          where: { id },
          select: { userId: true },
        });
        if (!doctor) throw new NotFoundException('Doctor not found');
        const pagination = { skip: page.skip, take: page.take };
        if (query.tab === 'SCHEDULE') {
          const where = {
            staffUserId: doctor.userId,
            staffType: 'DOCTOR' as const,
          };
          const items = await tx.staffWorkSchedule.findMany({
            where,
            ...pagination,
            orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
            select: {
              id: true,
              startsAt: true,
              endsAt: true,
              status: true,
              scheduleType: true,
            },
          });
          const total = await tx.staffWorkSchedule.count({ where });
          return {
            items,
            pagination:
              page.convertPaginationResponseDtoFromTotalRecords(total),
          };
        }
        // The schema links the clinician through the session's assigned slot, not a separate performedBy field.
        const careSession = {
          status: 'COMPLETED' as const,
          appointmentSlot: { doctorSchedule: { doctorId: id } },
        };
        if (query.tab === 'HISTORY') {
          const where = { careSession, lockedAt: { not: null } };
          const records = await tx.consultation.findMany({
            where,
            ...pagination,
            orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
            select: {
              id: true,
              completedAt: true,
              careSession: {
                select: {
                  appointment: {
                    select: {
                      appointmentCode: true,
                      patient: {
                        select: { patientCode: true, fullName: true },
                      },
                    },
                  },
                  specialty: { select: { name: true } },
                },
              },
            },
          });
          const total = await tx.consultation.count({ where });
          const items = records.map(({ careSession: session, ...record }) => ({
            ...record,
            appointmentCode: session.appointment.appointmentCode,
            patient: session.appointment.patient,
            specialtyName: session.specialty.name,
          }));
          return {
            items,
            pagination:
              page.convertPaginationResponseDtoFromTotalRecords(total),
          };
        }
        const where = {
          consultation: { careSession, lockedAt: { not: null } },
        };
        const items = await tx.review.findMany({
          where,
          ...pagination,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            doctorRating: true,
            serviceRating: true,
            comment: true,
            createdAt: true,
          },
        });
        const total = await tx.review.count({ where });
        return {
          items,
          pagination: page.convertPaginationResponseDtoFromTotalRecords(total),
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }
}
