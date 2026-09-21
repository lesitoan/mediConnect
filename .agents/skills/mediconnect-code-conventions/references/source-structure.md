# MediConnect Source Structure

Read this reference before scaffolding, creating modules, moving files, or reviewing the source structure.

## Target Repository Structure

```text
mediConnect/
├── apps/
│   ├── patient-web/
│   ├── staff-web/
│   ├── patient-mobile/
│   ├── api-gateway/
│   └── services/
│       ├── identity-service/
│       ├── patient-service/
│       ├── provider-scheduling-service/
│       ├── appointment-service/
│       ├── reception-queue-service/
│       ├── clinical-service/
│       ├── payment-service/
│       ├── notification-service/
│       ├── audit-service/
│       └── ai-assistant-service/
├── packages/
│   ├── contracts/
│   ├── nest-common/
│   ├── api-client/
│   ├── validation/
│   ├── ui/
│   ├── eslint-config/
│   └── tsconfig/
├── docs/
├── infrastructure/
└── scripts/
```

Do not create another application or microservice when the responsibility still belongs to an existing bounded context.

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

## NestJS Services and API Gateway

Prefer official NestJS conventions. Each feature is represented by a plural module.

```text
src/
├── modules/
│   └── appointments/
│       ├── dto/
│       │   ├── create-appointment.dto.ts
│       │   └── update-appointment.dto.ts
│       ├── entities/
│       │   └── appointment.entity.ts
│       ├── appointments.controller.ts
│       ├── appointments.controller.spec.ts
│       ├── appointments.service.ts
│       ├── appointments.service.spec.ts
│       └── appointments.module.ts
├── common/
├── config/
├── app.module.ts
└── main.ts
```

- Follow Nest CLI conventions for modules, controllers, services, guards, pipes, filters, interceptors, gateways, and DTOs.
- Class names use PascalCase: `AppointmentsController`, `AppointmentsService`, `AppointmentsModule`, `CreateAppointmentDto`.
- Controllers handle transport and validation; services coordinate module use cases and business behavior.
- Add `domain`, `application`, and `infrastructure` layers only for sufficiently complex modules. Do not apply ceremonial Clean Architecture to every module.
- Keep Prisma services and adapters inside the service that owns the database.
- `common` contains technical utilities shared within one service, not business logic spanning multiple modules.

## Prisma and Databases

Each service has an independent Prisma directory:

```text
service-name/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── src/
```

- Each service connects to its own PostgreSQL database.
- Prisma models use PascalCase; fields used in code use camelCase.
- PostgreSQL columns use snake_case through `@map`.
- Do not create Prisma relations across databases.
- Store identifiers from other services only as external identifiers and validate them through an appropriate business contract.

## Shared Packages

- `contracts`: stable DTOs, event envelopes, OpenAPI contracts, or AsyncAPI contracts.
- `api-client`: generated or wrapped clients based on API contracts.
- `validation`: genuinely shared validation schemas without service-specific business rules.
- `ui`: reusable React UI components; filenames and exported components use PascalCase.
- `nest-common`: logging, error mapping, tracing, technical guards, and NestJS utilities.
- Do not place business entities, Prisma models, repositories, or domain services in shared packages.
