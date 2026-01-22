# rrouter-boilerplate Documentation

> A modern full-stack React Router application with TypeScript, Vite, Sass, and comprehensive tooling.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [CSS Token System](#css-token-system)
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
│   ├── styles/                    # CSS token system and design tokens
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

## CSS Token System

This project uses a **CSS Token System** based on Sass to manage all design tokens (colors, typography, spacing, dimensions, etc.) in a centralized, reusable way. The goal is to **minimize custom CSS file creation** and promote consistency across the design.

### Philosophy

- **Token-first design**: All design decisions (colors, fonts, sizes, spacing) are defined as tokens
- **Generated classes**: CSS classes are generated automatically from token maps
- **Reduced custom CSS**: Components should use generated token classes, not custom styles
- **Single source of truth**: Token definitions are centralized, making changes easy and consistent

### File Structure

```
app/styles/
├── abstracts/              # Token definitions (variables and maps)
│   ├── _colors.scss        # Color tokens (text, background, border)
│   ├── _typography.scss    # Typography tokens (fonts, sizes, line-heights)
│   ├── _dimensions.scss    # Size and dimension tokens
│   ├── _spacings.scss      # Spacing tokens
│   ├── _breakpoints.scss   # Responsive breakpoints
│   ├── _functions.scss     # Utility functions
│   ├── _mixins.scss        # Reusable mixins
│   └── index.scss          # Exports all abstracts
├── create/                 # CSS class generation from tokens
│   ├── _colors.scss        # Generates .c-txt-*, .c-bg-*, .c-br-* classes
│   ├── _typography.scss    # Generates .tp-w-*, .tp-s-*, .tp-ln-* classes
│   ├── _spacings.scss      # Generates spacing utility classes
│   ├── _sizes.scss         # Generates size utility classes
│   ├── _flex.scss          # Generates flexbox utility classes
│   ├── _root.scss          # Defines :root CSS custom properties
│   └── _index.scss         # Imports all create files
└── index.scss              # Main export file
```

### Token Categories

#### 1. **Colors** (`abstracts/_colors.scss`)

Defined as Sass variables, organized by use case:

- `$txt-*` - Text colors
- `$bg-*` - Background colors
- `$br-*` - Border colors

**Generated classes** (from `create/_colors.scss`):

- `.c-txt--primary` - Apply text color
- `.c-bg--brand` - Apply background color
- `.c-br--secondary` - Apply border color

**Example**:

```tsx
<div className="c-bg--brand c-txt--inverse">Branded content</div>
```

#### 2. **Typography** (`abstracts/_typography.scss`)

Font tokens with automatic weight application:

```scss
$tp-fonts: (
  s: (
    "Noto Sans",
    300,
  ),
  m: (
    "Noto Sans",
    500,
  ),
  l: (
    "Noto Sans",
    700,
  ),
);
```

**Generated classes** (from `create/_typography.scss`):

- `.tp-w--s` - Light weight (300) + Noto Sans
- `.tp-w--m` - Regular weight (500) + Noto Sans
- `.tp-w--l` - Bold weight (700) + Noto Sans
- `.tp-s--md` - Font size (16px)
- `.tp-ln--lg` - Line height (135%)
- `.tp-a--c` - Text align center
- `.tp-u` - Text underline
- `.tp--ell` - Ellipsis truncation

**Mixin for custom usage**:

```scss
@use "~/styles/abstracts/typography";

.my-custom-heading {
  @include typography.tp-font(l); // Applies 'Noto Sans' + font-weight: 700
}
```

#### 3. **Spacing** (`abstracts/_spacings.scss`)

Padding and margin tokens.

**Generated classes**:

- `.p--100` - Padding (8px)
- `.m--200` - Margin (16px)
- `.gap--50` - Gap (for flex/grid - 4px)

#### 4. **Dimensions** (`abstracts/_dimensions.scss`)

Width, height, and responsive dimension tokens.

#### 5. **Breakpoints** (`abstracts/_breakpoints.scss`)

Responsive breakpoints for media queries.

### Using the Token System

#### ✅ **DO: Use generated classes**

```tsx
// Good - uses token system
<div className="c-bg--primary c-txt--secondary tp-w--m tp-s--lg p--200">
  Content
</div>
```

#### ❌ **DON'T: Create custom styles for design decisions**

```tsx
// Avoid - creates unnecessary custom CSS
import styles from './custom.module.scss';

<div className={styles.customContainer}>Content</div>

// custom.module.scss
.customContainer {
  background-color: #ffffff; // Use .c-bg--primary instead
  color: #505a65;            // Use .c-txt--secondary instead
  font-size: 1.25rem;        // Use .tp-s--lg instead
  padding: 1rem;             // Use .sp-p--md instead
}
```

### When to Create Custom Styles

Custom Sass files should **only** be created for:

1. **Component-specific layouts** - Complex layout logic that can't be expressed with tokens
2. **Animations & transitions** - Keyframes and animation rules
3. **Complex selectors** - Pseudo-elements, pseudo-classes with specific logic
4. **Vendor-specific prefixes** - Browser compatibility workarounds

**Example of legitimate custom style**:

```scss
// myComponent.module.scss
.card {
  border-radius: var(--dim--200); // Uses token for radius
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); // Complex shadow logic
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}
```

### Adding New Tokens

When adding new design tokens:

1. **Define the token** in the appropriate `abstracts/_*.scss` file
2. **Add it to the map** (e.g., `$colors`, `$tp-sizes`, `$spacings`)
3. **The class generation loop** in `create/_*.scss` will automatically create the class
4. **No manual class creation needed**

**Example: Adding a new color**:

```scss
// abstracts/_colors.scss
$bg-success: #007759;
$backgrounds: (
  primary: $bg-primary,
  secondary: $bg-secondary,
  success: $bg-success, // New token
);

// create/_colors.scss automatically generates:
// .c-bg--success { background-color: #007759; }
```

### Debugging Token Classes

To see all available classes:

```bash
# Look at generated CSS in browser DevTools
# Or search your build output for .c-bg--, .tp-w--, etc.
```

To verify token values:

```scss
// In any Sass file
@use "~/styles/abstracts/colors";

.debug {
  color: colors.$txt-primary; // Access token directly
}
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
