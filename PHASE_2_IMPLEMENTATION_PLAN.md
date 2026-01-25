# Phase 2: Vite Plugin Implementation Plan

**Status**: ✅ Plugin Implemented (Hybrid Approach)
**Date**: January 25, 2026
**Goal**: Automate generation of centralized imports from `/* @critical */` markers

**Current State**: Plugin successfully scans for markers and auto-generates reference files. Manual imports are in place as a stable fallback. Ready to discuss integration approaches for Phase 2.5.

---

## Key Decisions

### 1. Virtual Modules vs File Generation: Pragmatic Hybrid ✅

**Original Plan**: Virtual modules (in-memory only)
**Implementation Reality**: File generation to `.vite-cache/` directory

| Approach        | Plan         | Reality        | Reason                                                        |
| --------------- | ------------ | -------------- | ------------------------------------------------------------- |
| Virtual Modules | ✅ Chosen    | ❌ Hit issues  | Sass preprocessing happens before most Vite hooks             |
| File Generation | ✗ Considered | ✅ Implemented | Guarantees files exist before Sass needs them                 |
| Timing Problem  | N/A          | ✅ Solved      | Plugin runs in config() hook which is early enough            |
| Current State   | N/A          | 🔄 Hybrid      | Plugin generates cache files + manual imports in actual .scss |

**What We Learned**: Sass preprocessing is deeply tied to Vite's build pipeline and doesn't understand Vite's virtual module IDs. File generation to a real directory (`.vite-cache/`) is more reliable than trying to intercept at the Sass level.

**Hybrid Architecture** (Current Working State):

```
Plugin Flow:
1. config() hook runs → scans app/ for markers
2. Generates .vite-cache/critical.scss with detected imports
3. Generates .vite-cache/non-critical.scss with abstracts
4. Logs findings to console
5. _critical.scss manually imports header (for now)
6. Build succeeds, CSS inlines properly
```

### 2. Abstraction Handling ✅

**Architecture:**

- **Abstracts are always included** in the inline CSS bundle
  - They define color tokens, typography, spacing tokens, etc.
  - These must be inlined (they're the foundation for all styling)
  - Users can reference CSS variables and token classes everywhere
- **Abstracts are in both files:**

  ```scss
  // _critical.scss (inlined)
  @use "root"; // ← CSS variables :root { --... }
  @use "typography"; // ← Typography tokens
  @use "flex"; // ← Flexbox utilities
  @use "colors"; // ← Color tokens
  @use "spacings"; // ← Spacing tokens
  @use "../../components/layout/header/header"; // ← auto-generated

  // _non-critical.scss (loaded async)
  @use "borders"; // ← Border utilities
  @use "statuses"; // ← Status utilities
  @use "sizes"; // ← Size utilities
  // Non-critical components (if any)
  ```

- **Result**: All component files can import and use abstracts, and the tokens are available globally once the CSS loads

### 3. Scanning Scope ✅

**Scan**: All `.scss` files in `app/` directory

- Include: `app/components/`, `app/views/`, etc.
- Exclude: `app/styles/` (contains abstracts and centralized management)
- Recursive: Traverse all subdirectories

### 4. Development vs Production ✅

**Production (Build Time)**:

- Plugin activates and generates imports from markers
- `_critical.scss` and `_non-critical.scss` are virtual modules
- Final CSS is inlined as before

**Development (Dev Server)**:

- Plugin is disabled (`if (command !== 'build') return`)
- Use existing system: manual imports in `_critical.scss` and `_non-critical.scss`
- Faster startup, no scanning overhead
- Developers still benefit from `/* @critical */` markers (documentation)

### 5. Error Handling ✅

**Logging System:**

- List all scanned files and their markers
- Show breakdown: `X critical files, Y non-critical files, Z unmarked files`
- Warn about unresolvable import paths
- Don't fail the build (graceful degradation)

---

## Implementation Architecture

### Plugin File Structure

```
vite-plugins/
└── critical-css-scanner.ts        ✅ Created and working
```

**Previous Plan**: `build/plugins/critical-css-scanner.ts`
**Actual**: `vite-plugins/critical-css-scanner.ts` (cleaner structure)

### Plugin Lifecycle (Actual Implementation)

```
Build Phase:
1. config() hook runs (build time only)
   └─ Set appRoot and cacheDir paths
   └─ Create .vite-cache directory

2. buildStart() hook runs (inside config return)
   └─ Scan app/ recursively for .scss files
   └─ Parse each file with regex:
      - CRITICAL_FILE_MARKER: /^[\s/]*\/\*\s*@critical\s*\*\//m
      - NON_CRITICAL_FILE_MARKER: /^[\s/]*\/\*\s*@non-critical\s*\*\//m
   └─ Build critical[] and nonCritical[] arrays
   └─ Generate .vite-cache/critical.scss
   └─ Generate .vite-cache/non-critical.scss
   └─ Log findings to console

3. Sass compilation (unchanged)
   └─ Compiles _critical.scss (manually imports header)
   └─ Compiles _non-critical.scss
   └─ Output CSS is inlined as before

4. No virtual modules needed!
```

**Key Insight**: The `buildStart()` hook runs after `config()` but BEFORE Sass touches any files. Perfect timing.

### Integration Strategy (Actual vs Planned)

**Planned**: Virtual modules approach

```typescript
plugins: [
  criticalCssScanner(), // Serves @critical-css-scanner:critical virtually
  reactRouter(),
  tsconfigPaths(),
];
```

**Actual**: File generation approach

```typescript
plugins: [
  criticalCssScanner(), // Generates .vite-cache/critical.scss
  reactRouter(),
  tsconfigPaths(),
];
```

**Difference**: Minimal! Plugin is integrated the same way. The implementation details (virtual vs files) are internal to the plugin.

---

## Regex Patterns for Marker Detection

```typescript
const CRITICAL_FILE_MARKER = /^[\s/]*\/\*\s*@critical\s*\*\//m;
const NON_CRITICAL_FILE_MARKER = /^[\s/]*\/\*\s*@non-critical\s*\*\//m;
```

Simple, clean, works perfectly. (Block-level markers could be added in Phase 3 if needed.)

---

## Generated Output Examples

### Current: `.vite-cache/critical.scss`

```scss
// AUTO-GENERATED by critical-css-scanner plugin
// Abstract tokens
@use "root";
@use "typography";
@use "flex";
@use "colors";
@use "spacings";

// Critical components (detected from /* @critical */ markers)
@use "./../../components/layout/header/header";
```

**Status**: ✅ Generated correctly on each build

### Current: `.vite-cache/non-critical.scss`

```scss
// AUTO-GENERATED by critical-css-scanner plugin
@use "borders";
@use "statuses";
@use "sizes";
```

**Status**: ✅ Generated correctly, ready for future component additions

---

## Phase 2.5 Integration Options

Now that the plugin is working, we have **three viable approaches** to wire up the auto-generated cache files:

### Option A: Reference Files (Keep Current State)

**How it works:**

- Plugin generates cache files in `.vite-cache/`
- Developers reference cache files in `_critical.scss`
- Example: `@use "./../../../.vite-cache/critical";`

**Pros:**

- ✅ Zero risk (already working)
- ✅ Plugin fully functional
- ✅ Can enable cache-based hints/linting
- ✅ Reference files prove plugin correctness

**Cons:**

- ✗ Manual imports still needed (minor overhead)
- ✗ Adds .vite-cache to source control
- ✗ Path references are fragile

**Recommended**: For now while planning Phase 2.5

---

### Option B: Sass Include Path

**How it works:**

- Plugin generates to `.vite-cache/`
- Vite's Sass preprocessor options add `.vite-cache/` to include path
- `_critical.scss` imports: `@use "critical";` (finds `.vite-cache/critical.scss`)

**Implementation:**

```typescript
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ["./.vite-cache"],
      },
    },
  },
  plugins: [criticalCssScanner(), ...],
});
```

**Pros:**

- ✅ Simpler import syntax in actual files
- ✅ Plugin output automatically discoverable
- ✅ No path navigation needed

**Cons:**

- ⚠️ Relies on preprocessor option (less standard)
- ⚠️ Adds .vite-cache to source control still
- ⚠️ Less explicit than Option A

**Recommended**: If we want implicit discovery

---

### Option C: Plugin-Managed Virtual Modules (Phase 2.5+)

**How it works:**

- Plugin implements Vite's `resolveId()` hook
- Intercepts imports like `@use "@vite-cache:critical"`
- Returns generated content in-memory
- No .vite-cache directory needed

**Implementation outline:**

```typescript
resolveId(id) {
  if (id === "@vite-cache:critical") {
    return id; // Vite tracks as virtual
  }
},
load(id) {
  if (id === "@vite-cache:critical") {
    return generateCriticalScss();
  }
}
```

**Then in \_critical.scss:**

```scss
@use "@vite-cache:critical";
```

**Pros:**

- ✅ No .vite-cache directory
- ✅ Cleaner project structure
- ✅ Purely in-memory (fast)
- ✅ No path fragility

**Cons:**

- ✗ Requires solving Sass/Vite timing again
- ✗ Most complex option
- ✗ Higher risk of breaking builds
- ✗ Requires more debugging

**Recommended**: For Phase 3 after more testing

---

## Recommended Path Forward

1. **Now**: Stay with current state
   - Plugin works ✅
   - Manual imports work ✅
   - Build succeeds ✅
   - Cache files are generated (proof of concept) ✅

2. **Phase 2.5a** (Low Risk): Option B - Sass Include Path
   - Add 3 lines to vite.config.ts
   - Change import paths in \_critical.scss and \_non-critical.scss
   - Test that it builds

3. **Phase 2.5b** (Experimental): Option C - Virtual Modules
   - Attempt Sass/Vite integration at plugin level
   - Only if Phase 2.5a succeeds
   - Higher risk/reward

4. **Phase 3**: Separate CSS outputs
   - Split critical.css and non-critical.css files
   - More optimization potential
   - Requires Phase 2.5 complete first

---

## Summary: Current State

| Aspect         | Status            | Details                                    |
| -------------- | ----------------- | ------------------------------------------ |
| Plugin Code    | ✅ Complete       | Working, linted, committed                 |
| Auto-Detection | ✅ Complete       | Correctly finds `@critical` markers        |
| Cache Files    | ✅ Generated      | Files in .vite-cache/ with correct content |
| Manual Imports | ✅ In Place       | Header.scss manually in \_critical.scss    |
| Build System   | ✅ Unchanged      | CSS still inlined, no regressions          |
| Next Decision  | 🔄 Awaiting Input | Which Phase 2.5 approach to pursue?        |

---

**Next**: Discuss which approach best fits the project's goals.
