import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogResult,
  Prisma,
  UserRole,
} from '../../generated/prisma/client';
import {
  AuditLogsService,
  type AuditEvent,
} from '../audit-logs/audit-logs.service';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { PrismaService } from '../database/services/prisma.service';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { UpdatePatientProfileDto } from './dto/patient/update-patient-profile.dto';

const PROFILE_SELECT = {
  id: true,
  patientCode: true,
  dateOfBirth: true,
  gender: true,
  address: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { fullName: true, email: true, phone: true } },
} satisfies Prisma.PatientSelect;
type PatientProfile = Prisma.PatientGetPayload<{
  select: typeof PROFILE_SELECT;
}>;

function present(profile: PatientProfile) {
  const { user, ...data } = profile;
  return {
    ...data,
    fullName: user!.fullName,
    email: user!.email,
    phone: user!.phone,
    dateOfBirth: profile.dateOfBirth?.toISOString().slice(0, 10) ?? null,
  };
}

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
  ) {}

  async getMine(actor: CurrentUserDto) {
    this.assertPatient(actor);
    return this.getByUserId(actor.id);
  }

  async getByUserId(userId: string) {
    const profile = await this.prisma.patient.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    });
    if (!profile)
      throw new NotFoundException('Chưa có hồ sơ bệnh nhân liên kết.');
    return present(profile);
  }

  async updateMine(
    input: UpdatePatientProfileDto,
    actor: CurrentUserDto,
    tx: Prisma.TransactionClient,
  ) {
    this.assertPatient(actor);
    if (!actor.permissions.includes(PermissionEnum.PATIENTS_WRITE_ME))
      throw new ForbiddenException(
        'Thiếu quyền cập nhật hồ sơ bệnh nhân của chính mình.',
      );
    return this.updateProfile(actor.id, input, actor, tx);
  }

  async updateProfile(
    userId: string,
    input: UpdatePatientProfileDto,
    actor: CurrentUserDto,
    tx: Prisma.TransactionClient,
  ) {
    if (!Object.values(input).some((value) => value !== undefined))
      throw new BadRequestException('Chưa có thông tin cập nhật.');
    const today = new Date(Date.now() + 7 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    if (input.dateOfBirth && input.dateOfBirth > today)
      throw new BadRequestException(
        'Ngày sinh không được nằm trong tương lai.',
      );
    const profile = await tx.patient.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    });
    if (!profile)
      throw new NotFoundException('Chưa có hồ sơ bệnh nhân liên kết.');
    const current = present(profile);
    const data: Prisma.PatientUpdateInput = {};
    const changed: NonNullable<AuditEvent['after']> = {};
    for (const field of [
      'dateOfBirth',
      'gender',
      'address',
      'emergencyContactName',
      'emergencyContactPhone',
    ] as const) {
      if (input[field] !== undefined && input[field] !== current[field]) {
        Object.assign(data, {
          [field]:
            field === 'dateOfBirth' && input[field]
              ? new Date(`${input[field]}T00:00:00.000Z`)
              : input[field],
        });
        // Audit stores field names only, never demographic or emergency-contact values.
        changed[`${field}Changed`] = true;
      }
    }
    if (!Object.keys(changed).length) return current;
    const updated = await tx.patient.update({
      where: { id: profile.id },
      data,
      select: PROFILE_SELECT,
    });
    await this.audit.record(
      {
        actor: {
          type: 'USER',
          id: actor.id,
          name: actor.name,
          role: actor.role as UserRole,
        },
        actionCode: 'PATIENT_PROFILE_UPDATE',
        module: 'PATIENTS',
        targetType: 'PATIENT',
        targetId: profile.id,
        result: AuditLogResult.SUCCESS,
        after: changed,
      },
      tx,
    );
    return present(updated);
  }

  private assertPatient(actor: CurrentUserDto) {
    if (actor.role !== UserRole.PATIENT)
      throw new ForbiddenException('Chức năng chỉ dành cho bệnh nhân.');
  }
}
