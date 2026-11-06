import { IntersectionType } from '@nestjs/swagger';
import { UpdatePatientProfileDto } from '../../../patients/dto/patient/update-patient-profile.dto';
import { UpdateAccountIdentityDto } from '../update-account-identity.dto';

export class UpdateMeDto extends IntersectionType(
  UpdatePatientProfileDto,
  UpdateAccountIdentityDto,
) {}
