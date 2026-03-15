# Frontend Guidelines

## Component Architecture

- Keep components small, composable, and focused on rendering.
- Every component must define a typed `Props` interface.
- Move non-render logic out of components into hooks.
- Do not hardcode user-facing text in components.
- Prefer shared UI primitives for repeated patterns.
- Input controls must reuse a shared input component instead of duplicating markup.
- Hyperlinks and text actions must use a shared link/action component when style and behavior are shared.
- Loading states must reuse the shared spinner component in `src/components/Spinner.tsx`.
- Do not create ad-hoc loaders in feature folders when the shared spinner covers the use case.

## Design Tokens

- Global color palette must be defined in `src/index.css` as CSS variables.
- Feature styles must consume global tokens instead of raw hex values when equivalent tokens exist.
- Shadows and semantic colors should use token names to keep branding changes centralized.
- Loader colors and sizes must use global loader tokens from `src/index.css`.

## Loader Standard

- Use `Spinner` as the default loader for all pending states.
- Use `tone="dark"` on light backgrounds and `tone="light"` on dark backgrounds.
- Use `size` variants (`sm`, `md`, `lg`) instead of local CSS overrides whenever possible.

## Hook Patterns

- Use hooks for business logic, side effects, and state transitions.
- Keep hooks pure in signature and return typed values.
- Prefer feature-specific hooks under `src/hooks` or feature-local hook files.

## Folder Rules

- `src/components`: shared presentational components.
- `src/features`: feature-oriented UI modules.
- `src/hooks`: reusable logic hooks.
- `src/services`: API/integration boundaries.
- `src/constants`: labels and other centralized constants.
- `src/types`: shared TypeScript types and interfaces.

## State Management Recommendations

- Use local state for isolated UI concerns.
- Use custom hooks to encapsulate domain behavior.
- Promote state up only when multiple siblings require it.
- Introduce external state libraries only when complexity requires it.

## Validation Workflow

- Run `pnpm lint` before completing any task.
- Run `pnpm typecheck` before completing any task.
- Run `pnpm verify` for final validation.
- Fix all errors before marking implementation as done.
