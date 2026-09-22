# MediConnect Working Rules

Every task that creates, edits, moves, scaffolds, or reviews source code in this repository must apply the `mediconnect-code-conventions` skill at `.agents/skills/mediconnect-code-conventions/SKILL.md`.

Mandatory rules:

- For Next.js, route and feature directories use kebab-case, and business feature names use plural nouns.
- For Next.js, React component files use PascalCase; hook and non-UI logic files use camelCase.
- For NestJS, directories and files use kebab-case, and business feature or module names use plural nouns.
- Classes, interfaces, types, enums, and React components use PascalCase.
- Variables, functions, methods, and properties use camelCase; booleans begin with `is`, `has`, `can`, or `should`.
- Constants use UPPER_SNAKE_CASE.
- NestJS follows recommended conventions such as `appointments.controller.ts`, `appointments.service.ts`, `appointments.module.ts`, and `create-appointment.dto.ts`.
- Enum, mode, status, and business string-union values use UPPER_SNAKE_CASE.
- PostgreSQL columns may use snake_case; Prisma fields used in code use camelCase.
- Do not add emoji, text icons, vector icons, or adjacent images unless explicitly requested.
- Do not add comments that explain obvious JSX or layout structure.
- Do not build the entire project after every small change. Build only for final acceptance, packaging, an explicit request, or necessary high-risk integration verification.
- The backend is a modular NestJS REST API monolith located in `apps/api`.
- Organize the API by business modules. Do not create top-level `admin` and `client` source trees or duplicate the same business logic for different frontends.
- Separate audience-specific HTTP behavior through `patient`, `staff`, and `admin` controllers and DTOs inside the module that owns the business capability.
- Prefer the audience names `patient`, `staff`, `admin`, `public`, and `me`; do not use the generic term `client` for backend routes or source boundaries.
- Keep business logic inside the module that owns it and expose explicit module services when another module needs that behavior.
- Audience-specific controllers may share application services and repositories, but every endpoint must enforce its own role, permission, ownership, and DTO validation requirements.
- Controllers must not access Prisma directly. Database access belongs in services or repositories owned by the relevant module.
- The API uses one Prisma schema, one migration history, and one PostgreSQL database.
- Avoid circular module dependencies and do not use `forwardRef` as the default design.

If the existing source structure does not comply, report the mismatch and avoid creating a parallel structure.
