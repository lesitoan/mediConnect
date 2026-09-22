# MediConnect Source Structure

Read this reference before scaffolding, creating modules, moving files, or reviewing the source structure.

## Target Repository Structure

```text
mediConnect/
├── apps/
│   ├── patient-web/
│   ├── staff-web/
│   ├── patient-mobile/
│   └── api/
├── packages/
│   ├── api-client/
│   ├── validation/
│   ├── ui/
│   ├── eslint-config/
│   └── tsconfig/
├── docs/
├── scripts/
├── package.json
├── package-lock.json
└── turbo.json
```

Do not create a separate backend service when the responsibility belongs to a module in `apps/api`.

## Next.js patient-web and staff-web

Organize source code by feature. Route and feature directories use kebab-case, while business features use plural nouns. File naming depends on the file's role.

```text
src/
├── app/
├── features/
│   └── appointments/
│       ├── components/
│       │   └── AppointmentCard.tsx
│       ├── hooks/
│       │   └── useAppointments.ts
│       ├── services/
│       │   └── appointmentsService.ts
│       ├── schemas/
│       │   └── appointmentSchema.ts
│       └── types/
│           └── appointmentTypes.ts
├── components/
│   └── ui/
├── config/
├── lib/
└── styles/
```

- `features` contains business capabilities and uses plural nouns.
- `components/ui` contains reusable UI only, not business-specific behavior.
- Component filenames and exported component names use PascalCase.
- Hook filenames use camelCase and begin with `use`, such as `useAppointments.ts`.
- Next.js helper, service, schema, type, and constants files use camelCase.
- Functions and variables use camelCase; booleans begin with `is`, `has`, `can`, or `should`.
- Constants use UPPER_SNAKE_CASE; types and interfaces use PascalCase.
- In `staff-web`, use Next.js route groups to separate Admin, Doctor, and Receptionist areas. Backend authorization remains mandatory.

## NestJS REST API Monolith

The backend is one modular NestJS application in `apps/api`. Each business capability is represented by a plural module.

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── config/
│   ├── database/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── modules/
│   │   └── appointments/
│   │       ├── dto/
│   │       │   ├── create-appointment.dto.ts
│   │       │   └── update-appointment.dto.ts
│   │       ├── entities/
│   │       │   └── appointment.entity.ts
│   │       ├── appointments.controller.ts
│   │       ├── appointments.controller.spec.ts
│   │       ├── appointments.service.ts
│   │       ├── appointments.service.spec.ts
│   │       └── appointments.module.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
└── package.json
```

- Follow Nest CLI conventions for modules, controllers, services, guards, pipes, filters, interceptors, gateways, and DTOs.
- Class names use PascalCase: `AppointmentsController`, `AppointmentsService`, `AppointmentsModule`, `CreateAppointmentDto`.
- Controllers handle HTTP transport and validation and must not access Prisma directly.
- Services coordinate module use cases and business behavior.
- A module may export an explicit service for another module to consume. Internal controllers and repositories remain private to the owning module.
- Avoid circular dependencies and treat `forwardRef` as an exceptional workaround rather than the default design.
- Add `domain`, `application`, and `infrastructure` layers only for sufficiently complex modules. Do not apply ceremonial Clean Architecture to every module.
- `common` contains API-wide technical utilities, not business logic spanning multiple modules.

## Patient, Staff, and Admin API Boundaries

Organize the API by business capability. Do not create parallel top-level trees such as `src/admin` and `src/client`, and do not duplicate services, repositories, or Prisma access for different frontend applications.

Use `patient` instead of the generic term `client`. Use `staff` for shared Doctor and Receptionist operations, and use `admin` for administrative operations.

The target business modules are:

```text
src/modules/
├── authentication/
├── users/
├── patients/
├── providers/
├── specialties/
├── schedules/
├── appointments/
├── reception-queues/
├── medical-records/
├── prescriptions/
├── payments/
├── invoices/
├── notifications/
├── reviews/
├── audit-logs/
└── ai-assistant/
```

Create a module only when its capability is being implemented. Do not scaffold every target module in advance.

Separate audience-specific transport and validation concerns inside the module that owns the capability:

```text
src/modules/appointments/
├── controllers/
│   ├── patient-appointments.controller.ts
│   ├── staff-appointments.controller.ts
│   └── admin-appointments.controller.ts
├── dto/
│   ├── patient/
│   │   ├── book-appointment.dto.ts
│   │   ├── cancel-appointment.dto.ts
│   │   └── reschedule-appointment.dto.ts
│   ├── staff/
│   │   └── update-appointment-status.dto.ts
│   └── admin/
│       └── resolve-appointment-conflict.dto.ts
├── appointments.repository.ts
├── appointments.service.ts
├── appointments.service.spec.ts
└── appointments.module.ts
```

- Patient, staff, and admin controllers may call the same module service and repository.
- Keep business invariants such as availability checks and appointment state transitions in the shared service, not in controllers.
- Use separate DTOs when audiences may update different fields or require different validation.
- Patient operations must validate resource ownership in the service even after authentication and role guards pass.
- Staff operations must enforce the appropriate Doctor or Receptionist permissions.
- Admin operations must enforce explicit permissions and must not automatically bypass business invariants.
- Public endpoints may use `public` in controller names when that distinction is necessary.
- Current-user resources should prefer `me` in routes instead of `client`.
- Frontend menu visibility is not authorization. Every protected backend operation must enforce its own access rules.

Recommended route boundaries:

```text
/api/v1/authentication/*
/api/v1/me/*
/api/v1/providers/*
/api/v1/appointments/*
/api/v1/staff/*
/api/v1/admin/*
```

Feature ownership follows the business domain:

- `authentication`: registration, login, logout, password recovery, and token or session lifecycle.
- `users`: accounts, roles, permissions, locking, password reset, login sessions, and account activity.
- `patients`: patient profiles and patient-specific demographic data.
- `providers`: doctors and other healthcare providers.
- `specialties`: medical specialties and provider-specialty assignments.
- `schedules`: working schedules, leave, overtime, availability, and schedule conflicts.
- `appointments`: booking, cancellation, rescheduling, no-shows, and appointment status transitions.
- `reception-queues`: check-in, queue positions, waiting status, and overload handling.
- `medical-records`: examination history, results, diagnoses, clinical documents, and clinical images.
- `prescriptions`: prescriptions and prescribed medication details.
- `payments`: payment attempts, payment status, and payment provider integration.
- `invoices`: invoices, receipts, and patient billing history.
- `notifications`: notification templates, delivery requests, delivery status, and patient notifications.
- `reviews`: provider ratings and service feedback.
- `audit-logs`: immutable administrative and system activity records.
- `ai-assistant`: patient-facing healthcare navigation and guidance within the approved product scope.

Do not create a generic business module named `exceptions`. Place exceptional workflows in the module that owns the affected invariant: appointment cancellation and rescheduling belong to `appointments`, schedule conflicts belong to `schedules`, and queue overload belongs to `reception-queues`. Technical HTTP exceptions remain in `common/filters`.

Keep patient self-service and admin account operations separate at the controller and DTO layers:

```text
src/modules/users/
├── controllers/
│   ├── patient-accounts.controller.ts
│   └── admin-users.controller.ts
├── dto/
│   ├── patient/
│   │   ├── change-password.dto.ts
│   │   └── update-profile.dto.ts
│   └── admin/
│       ├── assign-role.dto.ts
│       ├── reset-user-password.dto.ts
│       └── update-user-status.dto.ts
├── users.repository.ts
├── users.service.ts
└── users.module.ts
```

Do not reuse an unrestricted admin DTO for patient self-service operations. DTO boundaries must prevent patients from submitting administrative fields such as roles, permissions, account status, or lock state.

## Prisma and Database

The API owns a single Prisma schema and migration history:

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── src/
    └── database/
        ├── prisma.module.ts
        └── prisma.service.ts
```

- The API connects to one PostgreSQL database.
- Prisma models use PascalCase; fields used in code use camelCase.
- PostgreSQL columns use snake_case through `@map`; table names use `@@map` when appropriate.
- Prisma relations and transactions may span models owned by different modules when the business workflow requires them.
- Keep database access in module services or repositories; never expose Prisma to frontend applications.
- Do not place the Prisma schema, Prisma client, repositories, or database entities in `packages`.

## Shared Packages

- `api-client`: generated or wrapped REST clients based on the API's OpenAPI contract.
- `validation`: genuinely shared validation schemas without backend-only business rules.
- `ui`: reusable React UI components; filenames and exported components use PascalCase.
- `eslint-config`: shared linting configuration.
- `tsconfig`: shared TypeScript configuration.
- Do not create a shared package until at least two applications have a concrete need for it.
- Do not place business entities, Prisma models, repositories, or domain services in shared packages.
