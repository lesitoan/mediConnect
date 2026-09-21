---
name: mediconnect-code-conventions
description: Apply naming conventions, source-structure rules, and code-review standards to the MediConnect project using Next.js, NestJS, and Prisma. Use for every task that creates, edits, moves, scaffolds, or reviews source code in the MediConnect repository.
---

# MediConnect Code Conventions

Apply these rules to every source-code change in MediConnect. If a specific user request conflicts with this skill, explain the conflict before proceeding.

## Required Workflow

1. Before creating or moving source code, read the [source-structure reference](references/source-structure.md).
2. Check directory and file names before writing files.
3. Keep changes inside the application, service, or package that owns the relevant responsibility.
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

- Use `kebab-case` for application, service, and module directories: `api-gateway`, `identity-service`, `medical-records`.
- Use plural nouns for business feature and module directories: `appointments`, `notifications`, `users`.
- Follow the official NestJS file conventions: `appointments.controller.ts`, `appointments.service.ts`, `appointments.module.ts`, `create-appointment.dto.ts`, `appointment.entity.ts`.
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

- Do not import source code directly between microservices.
- Do not share Prisma models, repositories, or business entities through `packages`.
- Share only stable contracts, validation schemas, API clients, and genuinely reusable technical infrastructure.
- Each service owns its Prisma schema, migrations, and database.
- For NestJS, prefer the structure and conventions recommended by Nest CLI. Add domain, application, and infrastructure layers only when business complexity justifies them.
- If the existing structure violates these rules, do not create a parallel structure. Report the mismatch and perform a controlled rename only when authorized by the user.

## Completion Checklist

Before delivering a code change, confirm that:

- Next.js route and feature directories use kebab-case, and business features use plural nouns.
- React component files use PascalCase; Next.js hook and non-UI logic files use camelCase.
- NestJS directories and files follow kebab-case and official NestJS suffix conventions.
- Classes, types, and components use PascalCase; variables and functions use camelCase; constants and status values use UPPER_SNAKE_CASE.
- Source code is located in the correct application, service, module, and layer.
- No cross-service database dependency or direct source import was introduced.
- No unrequested emoji, icon, or redundant UI comment was added.
- A full project build was not run outside the allowed cases.
