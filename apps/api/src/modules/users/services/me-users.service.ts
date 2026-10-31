import { BadRequestException, Injectable } from '@nestjs/common';
import { PermissionEnum } from '../../authentication/constants/permissions.constant';
import { PatientsService } from '../../patients/patients.service';
import { UpdateMeDto } from '../dto/me/update-me.dto';
import { UsersService } from './users.service';

@Injectable()
export class MeUsersService {
  constructor(
    private readonly users: UsersService,
    private readonly patients: PatientsService,
  ) {}

  update(input: UpdateMeDto, userId: string) {
    if (!Object.values(input).some((value) => value !== undefined))
      throw new BadRequestException('Chưa có thông tin cập nhật.');
    const { fullName, ...profileInput } = input;
    const hasPatientChanges = Object.values(profileInput).some(
      (value) => value !== undefined,
    );
    return this.users.withLockedAccount(userId, async (tx) => {
      let user = await this.users.assertSelfPermission(
        tx,
        userId,
        PermissionEnum.USERS_UPDATE_ME,
      );
      if (fullName !== undefined)
        user = await this.users.updateName(tx, user, fullName);
      const patientProfile = hasPatientChanges
        ? await this.patients.updateMine(profileInput, user, tx)
        : undefined;
      return { ...user, ...(patientProfile ? { patientProfile } : {}) };
    });
  }
}
