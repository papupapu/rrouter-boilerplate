# rrouter-boilerplate Documentation

> A modern full-stack React Router application with TypeScript, Vite, Sass, and comprehensive tooling.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Code Quality](#code-quality)
- [Configuration Files](#configuration-files)
- [Development](#development)
- [Building & Deployment](#building--deployment)
- [Git Workflow](#git-workflow)

## Prerequisites

### Node Version

Before starting the application, ensure you are using Node 22:

```bash
nvm use 22
```

### Package Manager

This project uses **Yarn** as the package manager (v1.22.22+).

## Installation

Install all dependencies using Yarn:

```bash
yarn install
```

The `prepare` script will automatically run `husky install` to set up Git hooks.

## Available Scripts

### Development & Build

- `yarn dev` - Start development server with hot module reloading (HMR)
- `yarn build` - Build for production (outputs to `./build/` directory)
- `yarn start` - Start production server from built files
- `yarn typecheck` - Run TypeScript type checking and React Router code generation

### Code Quality

- `yarn lint` - Run ESLint on all TypeScript and TSX files
- `yarn format` - Run Prettier to format all project files

## Tech Stack

### Core Framework

| Technology   | Version | Purpose                               |
| ------------ | ------- | ------------------------------------- |
| React        | 19.2.3  | UI framework                          |
| React Router | 7.12.0  | Client-side routing and SSR framework |
| TypeScript   | 5.9.2   | Static type checking                  |
| Vite         | 7.1.7   | Build tool and dev server             |

### Styling

| Technology       | Version | Purpose                        |
| ---------------- | ------- | ------------------------------ |
| Sass             | 1.80.0  | CSS preprocessing              |
| modern-normalize | 2.0.0   | Modern CSS reset/normalization |

### Development Tools

| Technology         | Version | Purpose                       |
| ------------------ | ------- | ----------------------------- |
| ESLint             | 9.0.0   | Code linting (flat config)    |
| @typescript-eslint | 8.0.0   | TypeScript support for ESLint |
| Prettier           | 3.0.0   | Code formatter                |
| Husky              | 9.0.0   | Git hooks manager             |
| lint-staged        | 15.0.0  | Run linters on staged files   |

### Server Runtime

| Technology          | Version               | Purpose                                |
| ------------------- | --------------------- | -------------------------------------- |
| Node                | 22 (Alpine in Docker) | Runtime environment                    |
| @react-router/node  | 7.12.0                | Node.js adapter for React Router       |
| @react-router/serve | 7.12.0                | Production server for React Router SSR |

## Project Structure

```
rrouter-boilerplate/
├── app/                           # Application source code
│   ├── app.scss                   # Global styles with modern-normalize import
│   ├── root.tsx                   # Root layout and error boundary
│   ├── routes.ts                  # Route definitions
│   ├── routes/                    # Page route components
│   │   └── home.tsx
│   └── welcome/                   # Reusable components
│       └── welcome.tsx
├── public/                        # Static assets
├── .husky/                        # Git hooks (pre-commit)
├── .react-router/                 # React Router generated types
├── build/                         # Build output (generated)
├── .prettierrc                    # Prettier configuration
├── eslint.config.js               # ESLint flat config (ESLint 9+)
├── vite.config.ts                 # Vite build configuration
├── react-router.config.ts         # React Router configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies and scripts
├── Dockerfile                     # Docker container definition
└── DOCUMENTATION.md               # This file
```

## Code Quality

### Tooling Overview

This project is configured with a comprehensive code quality setup:

- **Prettier** (3.0.0) - Code formatter (enforces consistent code style)
- **ESLint** (9.0.0) - Code linter with flat config (catches errors and enforces best practices)
- **Husky** (9.0.0) - Git hooks manager
- **lint-staged** (15.0.0) - Runs linters on staged files before commit

### Pre-commit Hook

Before each commit, Husky automatically runs `lint-staged` (defined in `.husky/pre-commit`) which:

1. **TypeScript/TSX files (`*.{ts,tsx}`)**:
   - Runs `eslint --fix` (auto-fixes fixable issues)
   - Runs `prettier --write` (formats code)

2. **Other files (`*.{json,md,scss,css}`)**:
   - Runs `prettier --write` (formats code)

This ensures consistent code quality and formatting across the project before changes are committed.

### ESLint Configuration

**File**: `eslint.config.js` (flat config - ESLint v9+ standard)

- **Parser**: `@typescript-eslint/parser` for TypeScript support
- **Plugins**:
  - `@typescript-eslint/eslint-plugin` - TypeScript best practices
  - `eslint-plugin-react` - React best practices
  - `eslint-plugin-react-hooks` - React Hooks rules
- **Integration**: `eslint-config-prettier` disables conflicting formatting rules

**Rules**:

- `react/react-in-jsx-scope`: off (not needed with automatic JSX runtime)
- `react/prop-types`: off (using TypeScript for type safety)
- `@typescript-eslint/no-unused-vars`: warn (catches unused imports)

### Prettier Configuration

**File**: `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

**Key Settings**:

- Semicolons at end of statements
- Trailing commas for ES5+ compatibility
- Double quotes for strings
- 80 character line width
- 2-space indentation

## Configuration Files

### vite.config.ts

Vite configuration with React Router and TypeScript path alias support:

```typescript
plugins: [reactRouter(), tsconfigPaths()];
```

- `reactRouter()` - React Router Vite plugin (handles SSR, routing, code generation)
- `tsconfigPaths()` - Resolves TypeScript path aliases

### react-router.config.ts

React Router configuration:

```typescript
ssr: true; // Server-side rendering enabled by default
```

- **SSR**: Enabled by default for full-stack rendering

### tsconfig.json

**Key Compiler Options**:

| Option           | Value                     | Purpose                        |
| ---------------- | ------------------------- | ------------------------------ |
| target           | ES2022                    | Output ECMAScript version      |
| module           | ES2022                    | Module system                  |
| jsx              | react-jsx                 | JSX runtime (automatic)        |
| moduleResolution | bundler                   | Modern module resolution       |
| lib              | DOM, DOM.Iterable, ES2022 | Type definitions included      |
| paths            | `~/*`: `./app/*`          | Path alias for cleaner imports |

**Strict Mode**: Enabled for type safety

### app/app.scss

Global stylesheet entry point:

```scss
@import "modern-normalize";

html,
body {
  margin: 0;
  padding: 0;
}
```

- Imports `modern-normalize` for CSS reset
- Custom global styles can be added below
- No Tailwind CSS (uses Sass for styling)

## Development

### Starting the Development Server

```bash
yarn dev
```

This starts the Vite development server with:

- Hot Module Reloading (HMR) for instant updates
- React Router SSR in development mode
- TypeScript type checking enabled
- Default URL: `http://localhost:5173/`

### Type Checking

```bash
yarn typecheck
```

This runs:

1. `react-router typegen` - Generates React Router type definitions (placed in `.react-router/types/`)
2. `tsc` - TypeScript compiler in check-only mode (no output files)

### Code Checking

Before committing, run these manually:

```bash
yarn lint      # Check for linting errors (fails on error)
yarn format    # Format all files (modifies in place)
```

**Fixing Issues**: Many ESLint errors can be auto-fixed:

```bash
npx eslint . --fix
```

## Building & Deployment

### Production Build

```bash
yarn build
```

This creates an optimized production build in the `./build/` directory:

- **Server bundle**: `./build/server/index.js` (Node.js server)
- **Client bundle**: `./build/client/` (static assets, served by server)

Output characteristics:

- Minified code
- Optimized assets
- Source maps (if configured)

### Running Production Server

```bash
yarn start
```

This starts the production server on the built files:

- Requires `NODE_ENV=production` for optimal behavior
- Listens on port 3000 by default
- Serves both client and server bundles

### Docker Deployment

A `Dockerfile` is provided for containerization using Node 20 Alpine:

```bash
# Build image
docker build -t rrouter-boilerplate .

# Run container
docker run -p 3000:3000 rrouter-boilerplate
```

**Dockerfile Details**:

- Base image: `node:20-alpine` (small, production-ready)
- Installs dependencies with Yarn
- Builds application
- Exposes port 3000

## Git Workflow

### Pre-commit Hook Flow

When committing changes:

```bash
git add <files>           # Stage changes
git commit -m "message"   # Commit (triggers hook)
```

**Hook Execution** (via Husky + lint-staged):

1. Backs up original state in git stash
2. Runs linters on staged files
3. If linters find issues:
   - Auto-fixable issues are fixed
   - Code is formatted with Prettier
   - Modified files are re-staged
4. If checks pass: commit completes
5. If checks fail: reverts to original state, commit aborted

**Troubleshooting**:

If commit fails:

1. Review the error messages
2. Fix issues manually or run `yarn lint` to see details
3. Run `yarn format` to auto-format
4. Commit again

### Using Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of relative imports:
import Component from "../../../welcome/welcome";

// Use path alias:
import Component from "~/welcome/welcome";
```

**Configuration** (in `tsconfig.json`):

```json
"paths": {
  "~/*": ["./app/*"]
}
```

**Benefits**:

- Cleaner, shorter import paths
- Easier refactoring
- Works in both development and production

---

**Last Updated**: January 22, 2026
**Node**: v22+
**Package Manager**: Yarn v1.22.22+
