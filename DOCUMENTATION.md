# rrouter-boilerplate Documentation

## Prerequisites

### Node Version

Before starting the application, ensure you are using Node 22:

```bash
nvm use 22
```

## Installation

Install all dependencies using Yarn:

```bash
yarn install
```

## Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn typecheck` - Type checking and React Router code generation
- `yarn lint` - Run ESLint to check code quality
- `yarn format` - Run Prettier to format code

## Code Quality

This project uses:

- **Prettier** - Code formatter (enforces consistent code style)
- **ESLint** - Code linter (catches errors and enforces best practices)
- **Husky** - Git hooks manager
- **lint-staged** - Runs linters on staged files before commit

### Pre-commit Hook

Before each commit, Husky automatically runs `lint-staged` which:

1. Runs ESLint with auto-fix on TypeScript/TSX files
2. Runs Prettier on TypeScript/TSX files
3. Runs Prettier on JSON, Markdown, SCSS, and CSS files

This ensures consistent code quality across the project.
