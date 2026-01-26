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
- [State Management & Context API](#state-management--context-api)
- [Configuration Files](#configuration-files)
- [Development](#development)
- [Building & Deployment](#building--deployment)
- [Bundle Analysis](#bundle-analysis)
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
- `yarn analyze` - Build for production and open interactive bundle analysis report
- `yarn start` - Start production server from built files
- `yarn typecheck` - Run TypeScript type checking and React Router code generation

### Code Quality

- `yarn lint` - Run ESLint on all TypeScript and TSX files
- `yarn format` - Run Prettier to format all project files

## Tech Stack

### Core Framework

| Technology           | Version | Purpose                                                    |
| -------------------- | ------- | ---------------------------------------------------------- |
| React                | 19.2.3  | UI framework                                               |
| React DOM            | 19.2.3  | React DOM rendering                                        |
| React Router         | 7.12.0  | Client-side routing and SSR framework                      |
| use-context-selector | 2.0.0   | Context API optimization (prevents unnecessary re-renders) |
| TypeScript           | 5.9.2   | Static type checking                                       |
| Vite                 | 7.1.7   | Build tool and dev server                                  |

### Styling

| Technology       | Version | Purpose                        |
| ---------------- | ------- | ------------------------------ |
| Sass             | 1.80.0  | CSS preprocessing              |
| modern-normalize | 2.0.0   | Modern CSS reset/normalization |

### Development Tools

| Technology                | Version | Purpose                                 |
| ------------------------- | ------- | --------------------------------------- |
| ESLint                    | 9.0.0   | Code linting (flat config)              |
| @typescript-eslint        | 8.0.0   | TypeScript support for ESLint           |
| eslint-plugin-react       | 7.33.2  | React best practices for ESLint         |
| eslint-plugin-react-hooks | 4.6.0   | React Hooks rules for ESLint            |
| eslint-config-prettier    | 9.0.0   | Disables conflicting ESLint rules       |
| Prettier                  | 3.0.0   | Code formatter                          |
| Husky                     | 9.0.0   | Git hooks manager                       |
| lint-staged               | 15.0.0  | Run linters on staged files             |
| rollup-plugin-visualizer  | 6.0.5   | Bundle size analysis and reporting      |
| @react-router/dev         | 7.12.0  | React Router dev server and tools       |
| vite-tsconfig-paths       | 5.1.4   | Vite plugin for TypeScript path aliases |

### Type Definitions

| Technology       | Version | Purpose                    |
| ---------------- | ------- | -------------------------- |
| @types/node      | 22      | Node.js type definitions   |
| @types/react     | 19.2.7  | React type definitions     |
| @types/react-dom | 19.2.3  | React DOM type definitions |
| @types/eslint    | 8.56.0  | ESLint type definitions    |

### Server Runtime

| Technology          | Version               | Purpose                                |
| ------------------- | --------------------- | -------------------------------------- |
| Node                | 22 (Alpine in Docker) | Runtime environment                    |
| @react-router/node  | 7.12.0                | Node.js adapter for React Router       |
| @react-router/serve | 7.12.0                | Production server for React Router SSR |
| isbot               | 5.1.31                | Bot detection middleware for SSR       |

## Project Structure

```
rrouter-boilerplate/
├── app/                           # Application source code
│   ├── app.scss                   # Global styles with modern-normalize import
│   ├── root.tsx                   # Root layout and error boundary
│   ├── routes.ts                  # Route definitions
│   ├── routes/                    # Route configuration files (layouts, route structure)
│   │   ├── home.tsx               # Home route configuration
│   │   └── about/
│   │       ├── layout.tsx         # About section layout
│   │       └── about.tsx          # About route configuration
│   ├── views/                     # Page content components
│   │   ├── home/
│   │   │   └── home.tsx           # Home page content
│   │   └── about/
│   │       └── about.tsx          # About page content
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

## Critical CSS Implementation

### Overview

This project implements **critical CSS inlining** to improve First Contentful Paint (FCP) and overall page load performance. Critical CSS is the minimum CSS required to render above-the-fold content immediately, without waiting for external stylesheet downloads.

**Current Status**: Phase 2.5 (Hybrid Approach)

- ✅ Development mode: Perfect, all styles appear with HMR
- ⚠️ Production mode: All CSS inlined (known issue for Phase 3)

### How It Works

1. **Shell Buffering**: The server-side rendering (SSR) entry point uses a Node.js Transform stream to buffer HTML chunks
2. **Shell Detection**: When the `</head>` tag is detected, the shell is considered complete
3. **CSS Injection**: CSS is extracted from the build output and injected as an inline `<style>` tag in the HTML head
4. **Streaming**: After the head is processed, the remaining body content streams normally

### Architecture

**Server Entry Point**: `app/entry.server.tsx`

- Implements Transform stream for HTML buffering
- Detects shell completion at `</head>` tag
- Calls CSS processor asynchronously when ready

**CSS Processor**: `app/utils/beasties-processor.ts`

- Reads CSS file from build output (`build/client/assets/`)
- Injects full CSS as inline `<style id="critical-css">` tag before `</head>`
- **Removes external CSS link tag** from head section (prevents duplication)
- Handles errors gracefully with fallback to original HTML
- Production-only (skipped in development via `import.meta.env.PROD`)

### Current Limitation (Phase 2.5)

**Both critical and non-critical CSS are currently compiled into a single bundle and all inlined.** This is a temporary limitation while the build system transitions to proper CSS code splitting.

**Why this happens**:

- `app/styles/create/_index.scss` imports both `@use "critical"` and `@use "non-critical"`
- Vite creates single CSS bundle from both imports
- beasties-processor inlines the entire bundle
- Result: All CSS arrives inline, no external stylesheet

**Why it was necessary**:

- Development mode needs both imports so that HMR works correctly
- New components are auto-detected via plugin and should appear immediately
- Removing non-critical import would break development experience

**Phase 3 Solution**: Separate CSS entry points will split into:

- `root-*.css` (critical only, inlined)
- `non-critical-*.css` (external, lazy-loaded)

### Marking Styles as Critical vs Non-Critical

Component styles are marked using comment markers directly in the component Sass files. The build system **automatically detects these markers** and generates centralized imports—no manual import management needed.

**Critical styles** (inlined in head):

- Add `/* @critical */` comment at the top of component's Sass file
- Build system auto-detects and includes in inline CSS
- No need to manually add imports to `_critical.scss`
- Example: [app/components/layout/header/header.scss](app/components/layout/header/header.scss)

**Non-critical styles** (loaded asynchronously):

- Leave unmarked (default behavior), OR explicitly add `/* @non-critical */` for clarity
- Build system auto-detects and excludes from inline CSS
- Loads after initial page render

**Example: Adding a Button component to critical CSS**

Create the component with its styles:

```tsx
// app/components/button/Button.tsx
export const Button = ({ children, ...props }) => (
  <button className="btn" {...props}>
    {children}
  </button>
);
```

```scss
// app/components/button/button.scss
/* @critical */
@use "~/styles/abstracts" as *;

.btn {
  padding: var(--dim--200);
  background-color: var(--c-bg--brand);
  color: var(--c-txt--inverse);
  border: none;
  border-radius: var(--dim--100);
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: var(--c-bg--brand-hover);
  }
}
```

That's it! When you run `yarn build`, the plugin detects the `/* @critical */` marker and automatically includes this component's styles in the inline CSS. No additional configuration needed.

### How Auto-Generation Works

During the build process, the `critical-css-scanner` plugin:

1. **Scans** all `.scss` files in `app/` for `/* @critical */` and `/* @non-critical */` markers
2. **Reads** template files that define the structure and abstracts
3. **Generates** [app/styles/create/\_critical.scss](app/styles/create/_critical.scss) with:
   - All abstracts and foundational imports from the template
   - All detected critical component imports
4. **Generates** [app/styles/create/\_non-critical.scss](app/styles/create/_non-critical.scss) similarly
5. **Logs** findings to console for verification (shows what was detected)
6. **Inlines** critical CSS as before—CSS processor reads the generated file

**Generated files are auto-created and never committed to git.** Only template files (`_critical.template.scss`, `_non-critical.template.scss`) are tracked.

### Troubleshooting Auto-Generation

**Q: CSS didn't change after adding `/* @critical */` marker**
**A**:

1. Check console output during `yarn build` to see if marker was detected
2. Verify file is in `app/` directory (not `app/styles/`)
3. Ensure marker is at file start with exact syntax: `/* @critical */`
4. Run `yarn build` again (files are regenerated each build)
5. Look for console messages like: `[Critical CSS Scanner] ✅ Found 1 critical component:`

**Q: Can I manually edit `_critical.scss` or `_non-critical.scss`?**
**A**: No—these files are auto-generated and will be overwritten on the next build. To change what's included, add or remove the `/* @critical */` marker in your component file instead.

**Q: I don't see my component in the generated file**
**A**:

1. Check that the `/* @critical */` marker is at the very top of the file
2. Check that the file ends in `.scss` (not `.css` or other extension)
3. Check that the file is in the `app/` directory hierarchy
4. Run `yarn build` and check the console output for any errors
5. Verify the file path is accessible and readable

**Q: How do I verify what was auto-generated?**
**A**: Check the console output during `yarn build`. You'll see:

```
[Critical CSS Scanner] ✅ Found N critical components:
  • component1/component1.scss
  • component2/component2.scss
```

You can also inspect the locally generated `app/styles/create/_critical.scss` file (it's not in git, but visible in your local project).

### Performance Benefits

**Before Critical CSS**:

- CSS loaded via external `<link>` tag
- Additional network request required (blocking)
- Browser waits for CSS before rendering
- FCP delayed until stylesheet downloads

**After Critical CSS**:

- CSS inlined in `<head>` as `<style>` tag
- No additional network request
- Styles available immediately for rendering
- **Result**: 15-40% FCP improvement (depending on CSS size)

### Current Implementation Status

- **CSS Bundle Size**: 16.03 KB (full token system)
- **HTML Response**: 18.08 KB total (with CSS inlined)
- **Architecture**: Single compiled CSS file from all imports
- **Production**: CSS injection enabled only in production builds
- **Browser Support**: All modern browsers (Transform streams are Node.js server-side only)

### Server Logs

During production server startup with CSS inlining active:

```
[SSR] Shell buffer complete, triggering Beasties processing...
[Critical CSS] 📄 Found CSS file: root-CYjJAl5L.css (16.03 KB)
[Critical CSS] ✅ Inlined 16.03 KB of critical CSS (18.08 KB total)
[SSR] Shell processed, sending to client...
GET / 200 - - 8.384 ms
```

### Best Practices

1. **Mark Critical Components Only**: Add `/* @critical */` only to above-fold components (header, navigation, hero)
2. **Use Design Tokens**: Reference CSS variables and token classes instead of hardcoding values
3. **Keep Components Colocated**: Store component styles in the same folder as the component (e.g., `app/components/header/header.scss`)
4. **Marker Placement**: Add `/* @critical */` at the very start of the `.scss` file, before any other content
5. **Modern Sass Syntax**: Use `@use` instead of `@import` to avoid deprecation warnings
6. **Monitor Bundle Size**: Run `yarn analyze` regularly to track CSS growth
7. **Test Multiple Routes**: Verify styles render correctly on different pages (home, about, post, etc.)
8. **Component Workflow** (Important!):
   - ✅ **DO**: Mark components with `/* @critical */` at the file source
   - ✅ **DO**: Let the plugin auto-detect and auto-generate imports
   - ❌ **DON'T**: Manually add imports to `_critical.scss` (plugin will overwrite)
   - ❌ **DON'T**: Import component styles directly in component files (redundant, already bundled globally)

**Example of correct setup**:

```tsx
// ✅ DO - Just use the marker, plugin handles the rest
export const Button = ({ children, ...props }) => (
  <button className="btn" {...props}>
    {children}
  </button>
);

// Styles are in: app/components/button/button.scss
// File has marker: /* @critical */
// Plugin auto-detects and generates import in _critical.scss
```

```tsx
// ❌ DON'T - Direct import (redundant, already bundled globally via plugin)
import "./button.scss";

export const Button = ({ children, ...props }) => (
  <button className="btn" {...props}>
    {children}
  </button>
);
```

### Troubleshooting

**Issue**: CSS not appearing inlined

**Solution**: Ensure the CSS file exists in `build/client/assets/` after building:

```bash
yarn build
ls -la build/client/assets/*.css
```

**Issue**: Hydration errors or content not rendering

**Solution**: Verify `app/entry.server.tsx` is buffering correctly:

- Check that `</head>` detection is working
- Ensure processor returns valid HTML
- Check browser console for React hydration warnings

**Issue**: Development doesn't inline CSS

**This is expected**: CSS inlining only runs in production (`import.meta.env.PROD` check). In development, CSS loads normally for faster iteration.

### Implementation Details

**Template Files** (tracked in git):

- [app/styles/create/\_critical.template.scss](app/styles/create/_critical.template.scss) - Defines abstracts and structure
- [app/styles/create/\_non-critical.template.scss](app/styles/create/_non-critical.template.scss) - Defines utilities and structure

**Generated Files** (auto-created, not in git):

- `app/styles/create/_critical.scss` - Auto-generated from template + detected markers
- `app/styles/create/_non-critical.scss` - Auto-generated from template + detected markers

**Plugin** (Vite):

- [vite-plugins/critical-css-scanner.ts](vite-plugins/critical-css-scanner.ts) - Scans for markers and generates imports at build time

**Processor** (SSR):

- [app/utils/beasties-processor.ts](app/utils/beasties-processor.ts) - Reads generated CSS and inlines in HTML

### Phase 2.5: Auto-Generated Critical CSS

Starting with Phase 2.5, the critical CSS workflow is fully automated:

- **Developer adds**: `/* @critical */` marker to component Sass file
- **Plugin does**: Scans for markers and auto-generates centralized imports
- **Build does**: Compiles CSS and inlines automatically
- **Result**: No manual import management, no developer forgetfulness

This hybrid approach combines marker-based clarity with complete automation, ensuring all marked components are always included in the inline CSS.

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

## State Management & Context API

### Overview

This project uses **React Context API** for state management, optimized with the `use-context-selector` library to prevent unnecessary component re-renders. This approach provides a lightweight, built-in solution without external state management libraries.

### Why use-context-selector?

By default, React Context causes all consumers to re-render whenever the context value changes, even if they only use a small part of it. The `use-context-selector` library solves this by:

1. **Selective subscriptions** - Components only re-render when the specific value they select changes
2. **Performance optimization** - Avoids cascading re-renders across your component tree
3. **Minimal dependency** - Single, lightweight library with no additional dependencies
4. **TypeScript support** - Full type safety out of the box

### Implementation Pattern

The project follows a consistent pattern for context management:

**Step 1: Define the Context** (`app/context/layout/layout.tsx`)

```tsx
import { useState } from "react";
import { createContext, useContextSelector } from "use-context-selector";

const LayoutContext = createContext<{
  sidebarOpen: boolean;
  toggleSidebar: () => void;
} | null>(null);

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <LayoutContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      {children}
    </LayoutContext.Provider>
  );
};
```

**Step 2: Export Selector Hooks**

Create separate hooks for each piece of state:

```tsx
// Selector for state
export const useLayoutStateIsSidebarOpen = () =>
  useContextSelector(LayoutContext, (value) => value?.sidebarOpen);

// Selector for actions
export const useLayoutActionsToggleSidebar = () =>
  useContextSelector(LayoutContext, (value) => value?.toggleSidebar);
```

**Step 3: Use in Components**

```tsx
import {
  useLayoutStateIsSidebarOpen,
  useLayoutActionsToggleSidebar,
} from "~/context/layout/layout";

const Header = () => {
  const sidebarOpen = useLayoutStateIsSidebarOpen();
  const toggleSidebar = useLayoutActionsToggleSidebar();

  return (
    <div onClick={toggleSidebar}>{sidebarOpen ? "Close" : "Open"} Sidebar</div>
  );
};
```

### Best Practices

1. **Separate State and Actions** - Create distinct hooks for state values and action functions
2. **Type the Context** - Always provide TypeScript types for the context value
3. **Handle Null Values** - Use optional chaining (`?.`) to handle cases where context might be null
4. **Provider Wrapping** - Ensure the Provider wraps the entire component tree that needs access to the context
5. **Granular Selectors** - Create specific selector hooks rather than exposing the entire context

### Avoiding Re-render Issues

**Common Mistake:**

```tsx
// ❌ DON'T - This creates a new object every render
<MyContext.Provider value={{ state, action }}>
```

**Correct Approach:**

```tsx
// ✅ DO - Memoize or move value outside component
const value = useMemo(() => ({ state, action }), [state, action]);
<MyContext.Provider value={value}>
```

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

## Bundle Analysis

### Overview

The project includes `rollup-plugin-visualizer` to analyze and visualize the client-side bundle size during production builds. This helps identify which modules are taking up the most space and spot potential optimization opportunities.

### Generating a Bundle Report

```bash
yarn analyze
```

This command:

1. Builds the application for production
2. Generates an interactive bundle visualization report
3. Automatically opens `dist/stats.html` in your default browser

### Understanding the Report

The visualization shows:

- **Module sizes**: How much space each module and dependency takes in the final bundle
- **Gzip size**: Compressed size of modules (what users actually download)
- **Brotli size**: Alternative compression format
- **Color coding**: Identifies large modules that may need optimization
- **Interactive exploration**: Click modules to see details and dependencies

### Optimization Tips

When reviewing the bundle report:

1. **Identify large dependencies** - Check if any third-party libraries are unexpectedly large
2. **Code splitting opportunities** - Large route components can be lazy-loaded
3. **Tree-shaking effectiveness** - Ensure unused code is being removed
4. **Compression impact** - Review gzip vs brotli sizes to understand compression effectiveness

**Example optimization**: If a route's component is large, consider:

```tsx
// Instead of direct import
import AboutPage from "~/views/about/about.tsx";

// Use dynamic import (lazy loading)
const AboutPage = lazy(() => import("~/views/about/about.tsx"));
```

### CI/CD Integration

The `dist/stats.html` report is ignored by Git (see `.gitignore`), so it won't clutter your repository. For CI/CD pipelines, you can:

1. Generate reports on each build: `yarn analyze`
2. Archive the `dist/stats.html` as an artifact
3. Compare reports over time to track bundle size trends

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
