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
- Do not import source code or share database models between microservices.

If the existing source structure does not comply, report the mismatch and avoid creating a parallel structure.
