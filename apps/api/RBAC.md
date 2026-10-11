# RBAC adapted from TripByToanNgo

Reference implementation: `D:/Projects/TripByToanNgo/tripBackend`:

- `prisma/schemas/user.prisma`: `role`, `permission`, `infoPermission` and `user.roleId`.
- `src/modules/user/user.repository.ts`: includes `role.infoPermission.permission`.
- `src/modules/auth/guards/auth.guard.ts`: loads the current user's role and permissions from the database.
- `src/modules/role/guards/role.guard.ts`: checks the role name.
- `src/modules/permission/guards/permission.guard.ts`: requires every declared permission name.
- `src/modules/database/services/seed.service.ts`: provisions role and permission assignments.

## MediConnect implementation

`Role` and `Permission` have independent string IDs, unique names, descriptions, status (`ACTIVE`/`INACTIVE`), timestamps and `deletedAt`. `InfoPermission` has its own ID, role/permission foreign keys, description, timestamps and `deletedAt`. Its unique `(roleId, permissionId)` constraint prevents duplicate assignments. `User.roleId` references `Role.id`.

The existing Users module owns database access. `UsersRepository` includes non-deleted `role.infoPermission` entries whose permissions are active and non-deleted. `UsersService` rejects inactive/deleted accounts and roles, and exposes permission names for the guards. Authentication reloads this data for each request, so changing the role or revoking a grant takes effect on the next request even for an already-issued access token.

Registration looks up the active, non-deleted `PATIENT` role by name and stores its ID. Client-supplied role, permission and account status fields remain forbidden. OTP activation and password recovery also reject inactive/deleted roles.

The `/api/v1/me` response keeps `role` as the role name (for example `PATIENT`) and `permissions` as a list of names (for example `USERS_READ_ME`), and adds `roleId` as the actual database ID. It never returns password hashes or the raw relation graph.

```ts
import { RoleEnum } from './constants/roles.constant';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { AuthRole } from '../authentication/decorators/auth-role.decorator';
import { AuthPermission } from '../authentication/decorators/auth-permission.decorator';

@AuthRole(RoleEnum.ADMIN)
@AuthPermission(PermissionEnum.USERS_READ_ME)
```

When both decorators are present, both restrictions apply. `AuthRole` accepts one or more role names (any matching role); `AuthPermission` requires all declared permission names. New database-defined names may be passed as strings. Admin has no implicit permission bypass.

MediConnect retains its global guards, Bearer/HttpOnly-cookie transport, JWT validation, OTP and password lifecycle. It enforces unique names/assignments and filters soft-deleted or inactive authorization data. The current schema retains the reference's lowercase Prisma authorization model names and existing foreign-key field mappings; status/name values use UPPER_SNAKE_CASE. OTP challenges and password-reset grants now live in Redis.

The current domain schema has replaced the earlier authentication baseline. See [Redis OTP and current migration instructions](authentication_flow_analysis.md) for its User/UserStatus/AuthSession fields and verification setup. The current Prisma model names are `role`, `permission`, `infoPermission`; their original field names are retained and unique-name/grant constraints are enforced.
