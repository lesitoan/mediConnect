---
name: mediconnect-code-conventions
description: Apply naming conventions, source-structure rules, and code-review standards to the MediConnect project using Next.js, NestJS, and Prisma. Use for every task that creates, edits, moves, scaffolds, or reviews source code in the MediConnect repository.
---

# MediConnect Code Conventions

Apply these rules to every source-code change in MediConnect. If a specific user request conflicts with this skill, explain the conflict before proceeding.

## Required Workflow

1. Before creating or moving source code, read the [source-structure reference](references/source-structure.md).
2. Check directory and file names before writing files.
3. Keep changes inside the application, module, or package that owns the relevant responsibility.
4. After a small change, run only appropriately scoped checks such as targeted linting, type checking, or relevant tests when needed. Do not build the entire project after every change.
5. Run a full build only for final acceptance, packaging, an explicit user request, or a high-risk integration change that requires verification.

## Naming Rules

### Next.js and React

- Use `kebab-case` for route and feature directories: `order-history`, `medical-records`, `user-profiles`.
- Use plural nouns for feature directories representing business domains: `appointments`, `notifications`, `user-profiles`.
- Use `PascalCase` for React component files: `ProductCard.tsx`, `SearchModal.tsx`, `AppointmentForm.tsx`.
- Use `camelCase` for hook files and start their names with `use`: `useAuth.ts`, `useAppointments.ts`.
- Use `camelCase` for non-UI logic files such as helpers, services, schemas, types, and constants: `formatPrice.ts`, `appointmentsService.ts`, `appointmentSchema.ts`, `appointmentTypes.ts`.
- Keep framework-defined Next.js filenames unchanged: `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Preserve Next.js syntax for route groups and dynamic routes: `(admin)`, `[appointmentId]`.

### NestJS

- Use `kebab-case` for NestJS directories: `medical-records`, `reception-queues`, `audit-logs`.
- Use plural nouns for business feature and module directories: `appointments`, `notifications`, `users`.
- Follow the official NestJS file conventions: `appointments.controller.ts`, `appointments.service.ts`, `appointments.module.ts`, `create-appointment.dto.ts`, `appointment.entity.ts`.
- Prefix audience-specific controller filenames with `patient`, `staff`, or `admin`: `patient-appointments.controller.ts`, `staff-appointments.controller.ts`, `admin-appointments.controller.ts`.
- Keep audience-specific DTOs in `dto/patient`, `dto/staff`, or `dto/admin` when their fields, validation, or authorization meaning differs.
- Keep test files aligned with NestJS conventions: `appointments.service.spec.ts`, `appointments.e2e-spec.ts`.
- Do not rename NestJS files to camelCase or PascalCase.
- Preserve tool-defined filenames such as `schema.prisma`, `package.json`, and `tsconfig.json`.

### Code Identifiers

- Use `camelCase` for variables, functions, methods, and properties.
- Use `PascalCase` for classes, interfaces, types, enums, decorators, and React components.
- Prefix boolean names with a condition verb such as `is`, `has`, `can`, or `should`: `isLoading`, `hasPermission`, `canCancel`, `shouldRefresh`.
- Use `UPPER_SNAKE_CASE` for immutable constants: `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE`.
- Use `UPPER_SNAKE_CASE` for enum values and string literals representing modes, statuses, or business types.

```ts
type AuthViewMode = "LANDING" | "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

enum AppointmentStatus {
  PendingPayment = "PENDING_PAYMENT",
  Confirmed = "CONFIRMED",
  Cancelled = "CANCELLED",
}
```

- Use `snake_case` for physical PostgreSQL column names. Keep Prisma fields in `camelCase` and map them with `@map`; map table names with `@@map` when needed.

## Display Text and Icons

- Do not place emoji or text-based icons in visible text, messages, placeholders, labels, headings, or sample data.
- Do not add Lucide icons, SVGs, images, or other icons next to text unless the user explicitly requests them.
- Display text must be plain, clear, and understandable without relying on icons.

## Comments

- Do not add comments that merely describe obvious HTML, JSX, or layout sections such as `Logo Section`, `Main Container`, or `Button`.
- Add comments only when needed to explain an algorithm, business invariant, technical workaround, concurrency handling, or behavior that is difficult to infer from the code.
- Prefer clear function, type, and variable names over explanatory comments.

## Architectural Boundaries

- The backend is a modular NestJS REST API monolith located in `apps/api`.
- Organize business capabilities as modules under `apps/api/src/modules`.
- Organize the API by business module. Do not create top-level `admin` and `client` source trees.
- Do not duplicate modules, services, repositories, or Prisma access for different frontend applications.
- Separate audience-specific HTTP behavior through `patient`, `staff`, and `admin` controllers and DTOs inside the module that owns the capability.
- Prefer the audience names `patient`, `staff`, `admin`, `public`, and `me`. Do not use the generic term `client` as a backend source boundary or route prefix.
- Audience-specific controllers may share application services and repositories, but each controller must enforce its own roles, permissions, resource ownership, and DTO validation.
- Treat frontend visibility as presentation behavior only. Backend authorization remains mandatory for every protected operation.
- A module may export an explicit service for another module to consume. Do not reach into another module's controllers, repositories, or other internal implementation details.
- Controllers handle HTTP transport and validation only. Do not inject or access `PrismaService` directly from controllers.
- Keep business logic in the service, application, or domain layer owned by the relevant module.
- The API owns one Prisma schema, one migration history, and one PostgreSQL database. Relations and transactions may span models from different modules when required by the business workflow.
- Avoid circular module dependencies. Use `forwardRef` only as a documented exception after simpler dependency directions have been considered.
- Keep API-only technical utilities in `apps/api/src/common`, not in a shared package.
- Share only stable API clients, validation schemas, UI components, configuration, and genuinely reusable technical infrastructure through `packages`.
- Do not expose Prisma models or database access to frontend applications or shared frontend packages.
- For NestJS, prefer the structure and conventions recommended by Nest CLI. Add domain, application, and infrastructure layers only when business complexity justifies them.
- If the existing structure violates these rules, do not create a parallel structure. Report the mismatch and perform a controlled rename only when authorized by the user.

## Completion Checklist

Before delivering a code change, confirm that:

- Next.js route and feature directories use kebab-case, and business features use plural nouns.
- React component files use PascalCase; Next.js hook and non-UI logic files use camelCase.
- NestJS directories and files follow kebab-case and official NestJS suffix conventions.
- Classes, types, and components use PascalCase; variables and functions use camelCase; constants and status values use UPPER_SNAKE_CASE.
- Source code is located in the correct application, module, package, and layer.
- Audience-specific controllers and DTOs are inside the owning business module rather than a top-level frontend-specific tree.
- Patient, staff, and admin endpoints apply the required role, permission, ownership, and validation rules.
- Module boundaries are explicit, controllers do not access Prisma directly, and no circular dependency was introduced.
- No unrequested emoji, icon, or redundant UI comment was added.
- A full project build was not run outside the allowed cases.
