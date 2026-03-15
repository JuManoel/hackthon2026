# Frontend Agent Rules

This repository is optimized for AI coding agents.

## Stack

React + TypeScript + Vite

## Core Principles

Maintainability is more important than speed.

Components must be small and composable.

Business logic belongs in hooks.

Rendering belongs in components.

Reusable UI patterns (inputs, links, buttons, wrappers) must be extracted into shared components.

Loading indicators must use the shared spinner component in `src/components/Spinner.tsx`.

Do not create custom loader implementations when this shared spinner is sufficient.

## TypeScript

Strict mode is mandatory.

Never use `any`.

Use explicit types.

## Labels

User-facing text must never be hardcoded.

Always import labels from:

`src/constants/labels.ts`

## Design Tokens

Global color palette tokens must be defined in `src/index.css`.

Feature styles must consume shared tokens, not duplicate raw color literals.

## Validation

Before any task is considered complete the following commands must pass:

`pnpm lint`

`pnpm tsc --noEmit`

If validation fails the agent must fix the errors.

## Agent Completion Policy

No implementation is considered finished unless:

- lint passes
- typescript passes
- no magic literals exist
- component props are typed
