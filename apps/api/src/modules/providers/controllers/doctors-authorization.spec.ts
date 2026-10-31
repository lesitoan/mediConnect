import { Reflector } from '@nestjs/core';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import {
  PERMISSIONS_KEY,
  PUBLIC_ROUTE_KEY,
  ROLES_KEY,
} from '../../authentication/constants/authentication.constant';
import { PermissionEnum } from '../../authentication/constants/permissions.constant';
import { PermissionsGuard } from '../../authentication/guards/permissions.guard';
import { RoleEnum } from '../../users/constants/roles.constant';
import { AdminDoctorsController } from './admin-doctors.controller';
import { PublicDoctorsController } from './public-doctors.controller';

describe('Doctor endpoint authorization', () => {
  const reflector = new Reflector();
  const pauseHandler = Object.getOwnPropertyDescriptor(
    AdminDoctorsController.prototype,
    'pause',
  )?.value as (...args: never[]) => unknown;
  it.each([
    ['list', PermissionEnum.DOCTORS_READ],
    ['specialties', PermissionEnum.SPECIALTIES_READ],
    ['get', PermissionEnum.DOCTORS_READ],
    ['pauses', PermissionEnum.DOCTORS_READ],
    ['update', PermissionEnum.DOCTORS_WRITE],
    ['cancelPause', PermissionEnum.DOCTORS_WRITE],
  ] as const)('%s requires ADMIN and %s', (method, permission) => {
    const handler = AdminDoctorsController.prototype[method];
    expect(reflector.get(ROLES_KEY, handler)).toEqual([RoleEnum.ADMIN]);
    expect(reflector.get(PERMISSIONS_KEY, handler)).toEqual([permission]);
    expect(reflector.get(PUBLIC_ROUTE_KEY, handler)).toBe(false);
  });
  it('requires doctor write and appointment read to create a pause', () => {
    const handler = pauseHandler;
    expect(reflector.get(ROLES_KEY, handler)).toEqual([RoleEnum.ADMIN]);
    expect(reflector.get(PERMISSIONS_KEY, handler)).toEqual([
      PermissionEnum.DOCTORS_WRITE,
      PermissionEnum.APPOINTMENTS_READ,
    ]);
  });
  it('requires doctor and user write to create an account and doctor', () => {
    const handler = Object.getOwnPropertyDescriptor(
      AdminDoctorsController.prototype,
      'create',
    )?.value as (...args: never[]) => unknown;
    expect(reflector.get(ROLES_KEY, handler)).toEqual([RoleEnum.ADMIN]);
    expect(reflector.get(PERMISSIONS_KEY, handler)).toEqual([
      PermissionEnum.DOCTORS_WRITE,
      PermissionEnum.USERS_WRITE,
    ]);
  });
  it('denies access to the conflict details when appointment read is missing', () => {
    const handler = pauseHandler;
    const context = {
      getHandler: () => handler,
      getClass: () => AdminDoctorsController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { permissions: [PermissionEnum.DOCTORS_WRITE] },
        }),
      }),
    } as unknown as ExecutionContext;
    expect(() => new PermissionsGuard(reflector).canActivate(context)).toThrow(
      ForbiddenException,
    );
  });
  it.each(['list', 'get'] as const)(
    'public doctor %s is explicitly public',
    (method) => {
      expect(
        reflector.get(
          PUBLIC_ROUTE_KEY,
          PublicDoctorsController.prototype[method],
        ),
      ).toBe(true);
    },
  );
});
