# AI Context: rrouter-boilerplate

> Quick reference for AI models to understand this React Router application's architecture, conventions, and patterns.

## ⚠️ Prerequisites

**CRITICAL**: Before running ANY shell commands in this project:

```bash
nvm use 22  # ⚠️ ALWAYS run this first - Node 22 is required
```

**Package Manager**: Yarn (v1.22.22+)

## Project Overview

A production-ready React Router v7 SSR application with TypeScript, Vite, and a comprehensive Sass token system. Features automatic critical CSS inlining for optimized performance, component-scoped styling, and context-based state management.

**Key Characteristics**:

- Full-stack SSR (server + client rendering)
- CSS token-driven design system (no Tailwind)
- Automated critical CSS extraction and inlining
- TypeScript-first with strict type checking
- Zero-config auto-import detection for component styles

## Tech Stack (Core)

| Technology                | Purpose                                                |
| ------------------------- | ------------------------------------------------------ |
| React 19 + React Router 7 | UI framework + SSR routing                             |
| TypeScript 5.9            | Type safety                                            |
| Vite 7                    | Build tool + dev server                                |
| Sass 1.80                 | CSS preprocessing with token system                    |
| use-context-selector      | Optimized Context API (prevents unnecessary rerenders) |
| Node 22                   | Runtime (Alpine in Docker)                             |

**Full dependency list**: See [package.json](package.json)

## Architecture Highlights

### Server-Side Rendering (SSR)

- **Entry point**: [app/entry.server.tsx](app/entry.server.tsx)
- Uses Transform streams to inject critical CSS during HTML streaming
- Production-only optimization (dev mode loads CSS normally)
- Detects shell completion at `</head>` tag, then inlines CSS

### Critical CSS System

- **Status**: Fully automated, production-ready
- **How it works**:
  1. Components marked with `/* @critical */` in their SCSS files
  2. Build plugin ([vite-plugins/critical-css-scanner.ts](vite-plugins/critical-css-scanner.ts)) auto-detects markers
  3. Generates [app/styles/create/\_critical.scss](app/styles/create/_critical.scss) with detected imports
  4. SSR processor ([app/utils/beasties-processor.ts](app/utils/beasties-processor.ts)) inlines CSS in `<head>`
  5. Non-critical CSS loads asynchronously (non-blocking)
- **Performance**: ~52% faster First Contentful Paint (FCP)
- **Developer workflow**: Just add `/* @critical */` marker to component SCSS—auto-generated from there

**Detailed guide**: [CRITICAL_CSS_IMPLEMENTATION.md](CRITICAL_CSS_IMPLEMENTATION.md)

### CSS Token System

- **Location**: [app/styles/abstracts/](app/styles/abstracts/)
- **Design tokens**: Colors, typography, spacing, dimensions, borders, etc.
- **Auto-generated classes**: `.c-bg--primary`, `.tp-w--bold`, `.sp-p--200`, etc.
- **Usage options**:
  1. CSS variables: `var(--c-primary-500)`, `var(--sp-300)`
  2. Sass imports: `@use "styles/abstracts/colors" as *;`
  3. Utility classes: `className="c-bg--primary sp-p--200"`
- **Path resolution**: All imports resolve from `app/` directory (configured via Vite)

**Detailed guide**: [CRITICAL_CSS_IMPLEMENTATION.md](CRITICAL_CSS_IMPLEMENTATION.md#css-token-system)

### State Management

- **Pattern**: React Context API with `use-context-selector`
- **Why**: Prevents unnecessary re-renders via selective subscriptions
- **Convention**:
  - Create context with `createContext` from `use-context-selector`
  - Export separate hooks for state and actions
  - Example: `useLayoutStateIsSidebarOpen()`, `useLayoutActionsToggleSidebar()`
- **Location**: [app/context/](app/context/)

**Example**: See [app/context/layout/layout.tsx](app/context/layout/layout.tsx)

## Directory Structure (High-Level)

```
app/
├── routes/              # Route configurations (defines route structure)
│   ├── home.tsx         # Route config with loader/meta
│   ├── post.tsx
│   └── about/
│       ├── layout.tsx   # Nested layout for /about/*
│       └── about.tsx    # /about route
├── views/               # Page content components (UI only)
│   ├── home/home.tsx
│   ├── post/post.tsx
│   └── about/about.tsx
├── components/          # Reusable UI components
│   ├── layout/          # Layout components (header, footer, aside, nav)
│   │   └── header/
│   │       ├── Header.tsx
│   │       └── header.scss  # Component styles (can be marked @critical)
│   └── post/
├── styles/              # CSS token system
│   ├── abstracts/       # Design tokens (colors, typography, spacing, etc.)
│   └── create/          # Auto-generated CSS classes and critical/non-critical splits
├── context/             # Context providers and selectors
├── services/            # Data fetching and business logic
├── config/              # JSON configuration files
│   ├── api.config.json
│   ├── metadata.config.json
│   └── remote.config.json
├── utils/               # Utility functions
├── root.tsx             # Root layout + error boundary
├── routes.ts            # Route definitions
└── entry.server.tsx     # SSR entry point with critical CSS injection

build/                   # Generated build output (gitignored)
├── client/              # Client bundle (static assets)
└── server/              # Server bundle (Node.js)

public/                  # Static assets (copied to build/client)
vite-plugins/            # Custom Vite plugins (critical CSS scanner, etc.)
```

## Key Conventions

### 1. Routes vs Views Pattern

- **routes/**: Define loaders, actions, metadata, error boundaries
- **views/**: Pure UI components that receive data as props
- **Why**: Separation of concerns (data fetching vs presentation)

### 2. Component Colocation

- Store component files together: `components/button/Button.tsx` + `components/button/button.scss`
- Component SCSS auto-imported via build system (no manual imports needed)

### 3. Critical CSS Markers

```scss
/* @critical */
// Component SCSS for above-fold content (header, nav, hero)

.header {
  background: var(--c-primary-500);
  padding: var(--sp-300);
}
```

- Place `/* @critical */` at the very top of SCSS file
- Plugin auto-detects and includes in inline CSS
- Leave unmarked for below-fold components (footer, modals)

### 4. Sass Imports (Modern Syntax)

```scss
// ✅ DO - Modern syntax with namespacing
@use "styles/abstracts/colors" as *;
@use "styles/abstracts/typography" as *;

// ❌ DON'T - Deprecated syntax
@import "styles/abstracts/colors";
```

### 5. Path Aliases

```typescript
// ✅ DO - Use path alias (configured in tsconfig.json)
import Component from "~/components/button/Button";

// ❌ DON'T - Relative paths
import Component from "../../../components/button/Button";
```

- `~/` maps to `app/` directory

### 6. Context Selector Pattern

```typescript
// ✅ DO - Separate hooks for state and actions
export const useLayoutStateIsSidebarOpen = () =>
  useContextSelector(LayoutContext, (value) => value?.sidebarOpen);

export const useLayoutActionsToggleSidebar = () =>
  useContextSelector(LayoutContext, (value) => value?.toggleSidebar);

// ❌ DON'T - Expose entire context (causes unnecessary rerenders)
export const useLayout = () => useContext(LayoutContext);
```

### 7. Component Imports (NO Manual SCSS Imports)

```tsx
// ✅ DO - Just use the component (styles auto-imported globally)
export const Button = ({ children }) => (
  <button className="btn">{children}</button>
);

// ❌ DON'T - Manual SCSS import (redundant, already bundled)
import "./button.scss";
```

## Essential Commands

```bash
# ⚠️ ALWAYS run first before any command
nvm use 22

# Development
yarn dev              # Start dev server (http://localhost:5173)

# Production
yarn build            # Build for production (outputs to ./build/)
yarn start            # Run production server

# Code Quality
yarn typecheck        # TypeScript type checking + React Router codegen
yarn lint             # ESLint (auto-fix: add --fix flag)
yarn format           # Prettier formatting

# Analysis
yarn analyze          # Build + open bundle size visualization
```

## Configuration Files

| File                                             | Purpose                                 |
| ------------------------------------------------ | --------------------------------------- |
| [vite.config.ts](vite.config.ts)                 | Vite build config + React Router plugin |
| [react-router.config.ts](react-router.config.ts) | React Router SSR config                 |
| [tsconfig.json](tsconfig.json)                   | TypeScript config (paths, strict mode)  |
| [eslint.config.js](eslint.config.js)             | ESLint flat config (v9+)                |
| [.prettierrc](.prettierrc)                       | Prettier formatting rules               |

**Detailed guide**: [CONFIGURATION_SYSTEM.md](CONFIGURATION_SYSTEM.md)

## Data Fetching Pattern

React Router's loader pattern:

```typescript
// routes/post.tsx
export async function loader({ params }: Route.LoaderArgs) {
  const post = await fetchPost(params.id);
  return { post };
}

// Component receives typed data
export default function Post({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;
  return <PostView post={post} />;
}
```

**Detailed guide**: [DATA_FETCHING_GUIDE.md](DATA_FETCHING_GUIDE.md)

## File Organization Principles

1. **Route files** ([app/routes/](app/routes/)) configure routing structure
   - Define loaders, actions, meta, headers, error boundaries
   - Import view components for presentation

2. **View files** ([app/views/](app/views/)) contain UI logic
   - Receive data as props
   - Handle user interactions
   - Delegate data mutations to route actions

3. **Component files** ([app/components/](app/components/)) are reusable
   - Colocated with their SCSS files
   - Marked `/* @critical */` if above-fold
   - Use token system for styling

4. **Service files** ([app/services/](app/services/)) handle external data
   - Fetch from APIs
   - Transform responses
   - Called by route loaders/actions

5. **Context files** ([app/context/](app/context/)) manage global state
   - Provide context at root or layout level
   - Export selector hooks (not raw context)

## Code Quality Automation

- **Pre-commit hook** (Husky + lint-staged):
  - Auto-runs ESLint + Prettier on staged files
  - Auto-fixes fixable issues
  - Prevents commits with errors

- **TypeScript**: Strict mode enabled (`tsconfig.json`)
- **ESLint**: Flat config (v9+) with React + TypeScript rules
- **Prettier**: 80 char width, semicolons, double quotes

## Common Patterns

### Adding a New Route

1. Create route config in [app/routes/](app/routes/) (e.g., `products.tsx`)
2. Create view component in [app/views/](app/views/) (e.g., `products/products.tsx`)
3. Define loader/action if needed
4. Export default component that renders view

### Adding a New Component

1. Create component file: `app/components/card/Card.tsx`
2. Create styles: `app/components/card/card.scss`
3. Mark styles `/* @critical */` if above-fold
4. Build system auto-detects and includes styles

### Using Design Tokens

```scss
// Option 1: CSS variables (runtime-dynamic)
.component {
  color: var(--c-primary-500);
  padding: var(--sp-300);
}

// Option 2: Sass variables (compile-time, type-safe)
@use "styles/abstracts/colors" as *;
.component {
  background: $bg-brand;
}

// Option 3: Utility classes (rapid prototyping)
<div className="c-bg--primary sp-p--300" />
```

## Important Documentation Links

- **Critical CSS System**: [CRITICAL_CSS_IMPLEMENTATION.md](CRITICAL_CSS_IMPLEMENTATION.md)
- **Data Fetching**: [DATA_FETCHING_GUIDE.md](DATA_FETCHING_GUIDE.md)
- **Configuration**: [CONFIGURATION_SYSTEM.md](CONFIGURATION_SYSTEM.md)
- **Performance Analysis**: [PERFORMANCE_ANALYSIS.md](PERFORMANCE_ANALYSIS.md)
- **Comprehensive Docs**: [DOCUMENTATION.md](DOCUMENTATION.md)

## Quick Troubleshooting

**CSS not appearing**: Check `/* @critical */` marker is at file start, run `yarn build` to regenerate

**TypeScript errors**: Run `yarn typecheck` to see details, check [.react-router/types/](/.react-router/types/) is generated

**Import errors**: Verify `~/*` alias in [tsconfig.json](tsconfig.json), restart TypeScript server in IDE

**Pre-commit failing**: Run `yarn lint --fix && yarn format` to auto-fix issues

---

**Last Updated**: February 21, 2026  
**Node Requirement**: v22+ (via nvm)  
**Package Manager**: Yarn v1.22.22+
