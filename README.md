# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Documentation

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** — Complete project guide covering setup, project structure, tech stack, CSS Token System, code quality, state management, and more
- **[CRITICAL_CSS_IMPLEMENTATION.md](./CRITICAL_CSS_IMPLEMENTATION.md)** — Comprehensive guide to the automatic critical CSS inlining system (production-ready, Phase 4 complete)

## Styling

This template uses a **CSS Token System** with **automatic critical CSS inlining**:

- ✅ Sass-based design tokens (colors, typography, spacing, etc.)
- ✅ Auto-generated utility classes
- ✅ Automatic inlining of above-the-fold CSS for faster page loads
- ✅ Lazy-loading of non-critical CSS

For complete styling documentation, see [DOCUMENTATION.md - CSS Token System](./DOCUMENTATION.md#css-token-system) and [CRITICAL_CSS_IMPLEMENTATION.md](./CRITICAL_CSS_IMPLEMENTATION.md).

---

Built with ❤️ using React Router.
