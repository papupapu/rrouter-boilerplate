# Critical CSS Auto-Generation Implementation Summary

## Overview

A complete hybrid critical CSS system has been implemented that automatically generates and manages critical (inlined) and non-critical (async-loaded) CSS imports. The system eliminates manual import management, works in both development and production modes, and includes hot module reloading (HMR) support.

## Key Features

✅ **Zero-friction developer experience** - Just add a `.scss` file and it's automatically imported  
✅ **Marker-based classification** - Add `/* @critical */` to mark styles as above-the-fold  
✅ **Smart defaults** - Unmarked files automatically treat as non-critical  
✅ **Dev/build consistency** - Works identically in `yarn dev` and `yarn build`  
✅ **HMR support** - New SCSS files are auto-detected and imported without restart  
✅ **Template preservation** - Design token changes propagate automatically  
✅ **Git-friendly** - Only templates tracked; generated files are gitignored

## Architecture

### Core Components

1. **Vite Plugin** (`vite-plugins/critical-css-scanner.ts`)
   - Scans `app/` directory recursively for `.scss` files
   - Detects `/* @critical */` markers at file start
   - Generates complete import files at startup and on file changes
   - File watcher monitors component directory for HMR

2. **Template Files** (`app/styles/create/`)
   - `_critical.template.scss` - Template for critical (inlined) CSS
   - `_non-critical.template.scss` - Template for async-loaded CSS
   - Preserve design token abstracts and utilities
   - Include `// AUTO-GENERATED SECTION BELOW` marker for imports

3. **Generated Files** (gitignored)
   - `_critical.scss` - Auto-generated critical imports + template header
   - `_non-critical.scss` - Auto-generated non-critical imports + template header
   - Regenerated on every build and dev server startup
   - Regenerated on file changes during development

## File Structure

```
app/
├── styles/
│   ├── create/
│   │   ├── _critical.template.scss        # Template for critical CSS
│   │   ├── _non-critical.template.scss    # Template for non-critical CSS
│   │   ├── _critical.scss                 # [gitignored] Auto-generated
│   │   └── _non-critical.scss             # [gitignored] Auto-generated
│   ├── abstracts/
│   │   ├── _colors.scss
│   │   ├── _typography.scss
│   │   └── ... other design tokens
│   └── index.scss                         # Imports create files
├── components/
│   ├── layout/
│   │   ├── header/
│   │   │   └── header.scss               # Has /* @critical */ marker
│   │   └── footer/
│   │       └── footer.scss               # No marker → non-critical
│   └── ... other components
└── views/
    ├── home/
    │   └── home.scss                     # No marker → non-critical
    └── ... other views
```

## Marker System

### Critical CSS (Inlined in `<head>`)

Add to the first line of any `.scss` file:

```scss
/* @critical */

.header {
  // Above-the-fold styles
}
```

**Usage:**

- Navigation and layout styles
- Hero/banner content
- Above-the-fold images and text
- Critical interaction feedback

### Non-Critical CSS (Async-loaded)

**No marker needed** - default behavior for unmarked files:

```scss
.footer {
  // Below-the-fold or less critical styles
}
```

**Usage:**

- Footer and sidebar styles
- Modals and overlays
- Utility classes
- Non-critical components

## Implementation Details

### Plugin Hook: `config()`

1. Resolves `app/` directory path
2. Creates `styles/create/` directory if missing
3. Scans directory tree recursively
4. Reads marker detection regex: `/^[\s/]*\/\*\s*@critical\s*\*\//m`
5. Reads template files from `styles/create/`
6. Generates complete SCSS from templates + detected imports
7. Writes generated files to disk
8. Logs detection results

**Exclusions during scan:**

- `app.scss` - prevents circular dependency
- `styles/` directory - contains abstracts and templates, not components

### Plugin Hook: `configResolved()`

**Development mode only:**

1. Sets up file watcher on `app/` directory
2. Monitors for `.scss` file changes
3. Debounces regeneration (300ms) to ensure files fully written
4. **Excludes** `styles/create/` to prevent infinite loop

**File watcher detection:**

- ✅ Watches: `components/**/*.scss`, `views/**/*.scss`
- ❌ Ignores: `styles/create/`, `node_modules/`, `.git/`

### Path Computation

Relative path generation for Sass `@use` statements:

```typescript
// Input: file relative to app/ (e.g., "components/layout/header/header.scss")
const fileWithoutExtension = file.replace(/\.scss$/, "");
const componentFullPath = path.join(appRoot, fileWithoutExtension);
const relativePath = path.relative(stylesDir, componentFullPath);
const importPath = relativePath.replace(/\\/g, "/"); // Normalize separators

// Output: "../../components/layout/header/header"
// Result: @use "../../components/layout/header/header";
```

## Development Workflow

### Starting Development

```bash
yarn dev
```

**What happens:**

1. Plugin scans existing component files
2. Generates `_critical.scss` and `_non-critical.scss`
3. File watcher initializes and waits for changes
4. Dev server starts on port 5173+

### Adding a New Component

1. Create file: `app/components/my-component/my-component.scss`
2. Add styles (with or without `/* @critical */` marker)
3. **Save file** → watcher detects change → imports auto-generated
4. No restart needed - styles available immediately

### Modifying a Component

1. Edit existing `.scss` file
2. **Save file** → watcher detects change → imports regenerated if needed
3. Hot reload applies changes instantly

### Deleting a Component

1. Delete `.scss` file from disk
2. **File deletion detected** → imports regenerated without that file
3. No manual cleanup needed

## Build Workflow

```bash
yarn build
```

**What happens:**

1. Plugin scans all component files
2. Generates `_critical.scss` and `_non-critical.scss`
3. React Router builds client and server bundles
4. Critical CSS is extracted and inlined in HTML
5. Non-critical CSS is included in async stylesheet

## Generated File Structure

### `_critical.scss` Example

```scss
// CRITICAL CSS TEMPLATE
// ⚠️  This file defines abstracts and inlined styles for critical rendering path.
// Component imports are auto-generated from /* @critical */ markers during build.

// Design tokens (always included)
@use "abstracts/root";
@use "abstracts/typography";
@use "abstracts/flex";
@use "abstracts/colors";
@use "abstracts/spacings";

// AUTO-GENERATED SECTION BELOW
@use "../../components/layout/header/header";
```

### `_non-critical.scss` Example

```scss
// NON-CRITICAL CSS TEMPLATE
// ⚠️  This file defines utilities and structure for non-critical (async-loaded) CSS.
// Component imports are auto-generated from /* @non-critical */ markers during build.

// Utilities
@use "borders";
@use "statuses";
@use "sizes";

// AUTO-GENERATED SECTION BELOW
@use "../../components/layout/footer/footer";
@use "../../views/home/home";
@use "../../views/about/about";
```

## Key Fixes Implemented

### 1. Sass Syntax (Block Comments Breaking)

**Problem:** Templates with block comments like `/** ... */` caused Sass parsing errors: "expected {".

**Solution:** Changed all templates to single-line comments (`//`).

**Why:** Sass doesn't allow block comments near `@use` statements.

### 2. Relative Path Computation

**Problem:** Generated paths were incorrect (e.g., `./../../header/header` instead of `../../components/layout/header/header`).

**Root Cause:** Used wrong base directory for `path.relative()` and incorrect path joining.

**Solution:** Use `path.relative(baseDir, componentPath)` with correct scoping.

### 3. Circular Dependency

**Problem:** `app.scss` was auto-detected and included in non-critical imports, creating module loop.

**Solution:** Added check to skip `app.scss` in scan function.

### 4. Development vs Production Modes

**Problem:** Plugin only ran during `yarn build`, not `yarn dev` - new files weren't detected in development.

**Solution:** Removed `apply: "build"` restriction to enable plugin in both modes.

### 5. Infinite Loop in HMR

**Problem:** File watcher detected writes to generated files (`_critical.scss`, `_non-critical.scss`), triggering regeneration again.

**Solution:** Excluded `styles/create/` directory from watcher events.

**Why:** Only component files should trigger regeneration, not generated output files.

## Git Integration

### `.gitignore` Entries

```
# Critical CSS auto-generated files (regenerated on every build/dev)
app/styles/create/_critical.scss
app/styles/create/_non-critical.scss

# Vite dev server cache
.vite-cache/
```

### Files to Commit

✅ `_critical.template.scss` - Template for critical CSS  
✅ `_non-critical.template.scss` - Template for non-critical CSS  
✅ `vite-plugins/critical-css-scanner.ts` - Plugin implementation  
✅ Component `.scss` files - Actual component styles

### Files NOT to Commit

❌ `_critical.scss` - Auto-generated, gitignored  
❌ `_non-critical.scss` - Auto-generated, gitignored

## Testing

### Test Development HMR

```bash
yarn dev
# Create new file: app/components/test/test.scss
# File should appear in logs immediately without restart
```

### Test Production Build

```bash
yarn build
# Check logs for component detection
# Verify CSS is inlined in build output
```

### Test File Changes

During `yarn dev`:

```bash
# Add new component
touch app/components/new/new.scss

# Modify existing component
echo ".class { color: red; }" >> app/components/existing/existing.scss

# Delete component
rm app/components/old/old.scss

# All changes detected without restart
```

## Performance Considerations

### File Watcher

- **Debounce:** 300ms to prevent excessive regeneration
- **Scope:** Recursive watch on `app/` directory
- **Exclusions:** Filters out `node_modules`, `.git`, `styles/create`
- **Dev only:** Only enabled in development mode (`yarn dev`)

### Build Time

- Plugin runs in `config()` hook - minimal overhead
- Single directory scan per build
- File I/O only for template reading and generated file writing

## Troubleshooting

### Issue: "Expected {" Sass Compilation Error

**Cause:** Block comments in SCSS templates.

**Fix:** Use only single-line comments (`//`) in template files.

### Issue: New files not detected in dev mode

**Cause:** File watcher not initialized or watching wrong directory.

**Fix:** Ensure you're running `yarn dev` (not `yarn build`) and wait for "Watching app directory" message.

### Issue: Infinite regeneration loop

**Cause:** Watcher detecting generated file writes.

**Fix:** Ensure `styles/create/` is excluded from watcher events (already fixed in code).

### Issue: Component import paths incorrect

**Cause:** Relative path computation using wrong base directory.

**Fix:** Path computation uses `path.relative(stylesDir, componentPath)` with Windows separator normalization.

## Browser DevTools

### Viewing Inlined CSS

In `<head>` of HTML:

```html
<style id="critical-css">
  /* Critical CSS inserted here - typically 2-5KB */
</style>
```

### Viewing Async CSS

Check Network tab for stylesheet with `<link rel="stylesheet">` tag.

## Future Enhancements

Possible improvements:

1. **CSS metrics** - Log total CSS sizes (critical vs non-critical)
2. **Performance warnings** - Alert if critical CSS exceeds threshold
3. **Marker validation** - Warn if marker syntax is incorrect
4. **Import ordering** - Ensure consistent import order for reproducible builds
5. **CSS coverage analysis** - Track which styles are actually used above-the-fold

## Conclusion

This implementation provides a robust, developer-friendly system for managing critical CSS that:

- **Eliminates manual work** - Automatic detection and import generation
- **Maintains consistency** - Same behavior in dev and production
- **Supports hot reloading** - Instant feedback during development
- **Preserves git hygiene** - Only necessary files tracked
- **Scales easily** - Works for projects with any number of components

The system is production-ready and has been tested with multiple components and file operations.
