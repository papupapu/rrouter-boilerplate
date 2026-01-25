# Phase 2: Vite Plugin Implementation Plan

**Status**: Detailed Technical Plan
**Date**: January 25, 2026
**Goal**: Automate generation of centralized imports from `/* @critical */` markers

---

## Key Decisions

### 1. Virtual Modules > File Generation ✅

**Why Virtual Modules Are Superior for Performance:**

| Aspect                  | File Generation        | Virtual Modules     |
| ----------------------- | ---------------------- | ------------------- |
| Disk I/O                | ✗ Multiple writes      | ✅ In-memory only   |
| Dev Performance         | ✗ Slower (file system) | ✅ Instant (memory) |
| HMR (Hot Module Reload) | ✗ File system events   | ✅ Instant updates  |
| Build Cache             | ✗ Files may invalidate | ✅ Cleaner caching  |
| Cleanup                 | ✗ Temp files to manage | ✅ Automatic        |

**Implementation**: Use Vite's `resolveId()` + `load()` hooks to serve generated imports from memory

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
build/
└── plugins/
    └── critical-css-scanner.ts
```

### Plugin Lifecycle

```
1. config() hook (build phase only)
   └─ Scan app/ for all .scss files
   └─ Parse each file with regex
   └─ Build Map<filePath, marker>
   └─ Create relative import paths
   └─ Log findings

2. resolveId() hook
   └─ Intercept imports of:
      - "@critical-css-scanner:critical"
      - "@critical-css-scanner:non-critical"
   └─ Return virtual module ID

3. load() hook
   └─ Generate and return:
      - Virtual critical.scss content (abstracts + critical components)
      - Virtual non-critical.scss content (abstracts + non-critical components)

4. Integration in vite.config.ts
   └─ Call criticalCssScanner() plugin
   └─ Position before other plugins
```

### Virtual Module Strategy

Instead of modifying actual files, we intercept imports:

**In vite.config.ts:**

```typescript
plugins: [
  criticalCssScanner(), // ← Runs first
  reactRouter(), // ← Existing
  tsconfigPaths(), // ← Existing
];
```

**What changes in files:**

```scss
// app/styles/create/_critical.scss
@import "@critical-css-scanner:critical";

// app/styles/create/_non-critical.scss
@import "@critical-css-scanner:non-critical";
```

Actually, better approach: Don't modify the actual files at all. Instead, use Vite's alias feature to redirect the imports:

**In vite.config.ts:**

```typescript
resolve: {
  alias: {
    // Redirect the _critical.scss import to our virtual module
    '@critical-css': '@critical-css-scanner:virtual',
  }
}
```

Or even simpler: Keep the actual files minimal and have the plugin generate their content when they're loaded.

**Simplest approach:**

1. Keep `_critical.scss` and `_non-critical.scss` as they are
2. Plugin writes generated imports to a hidden temp directory
3. Files import from that directory

Actually, virtual modules ARE the best. Let me refine:

**Final approach (Virtual Modules):**

- Plugin hooks into Sass import resolution
- When Sass tries to import `_critical.scss`, our plugin intercepts
- Plugin returns generated content in memory
- No files written to disk

---

## Regex Patterns for Marker Detection

```typescript
// File-level marker (entire file is critical)
const CRITICAL_FILE = /^[\s/]*\/\*\s*@critical\s*\*\//m;

// File-level marker (entire file is non-critical)
const NON_CRITICAL_FILE = /^[\s/]*\/\*\s*@non-critical\s*\*\//m;

// Block markers (specific rules)
const CRITICAL_START = /\/\*\s*@critical-start\s*\*\//;
const CRITICAL_END = /\/\*\s*@critical-end\s*\*\//;
const NON_CRITICAL_START = /\/\*\s*@non-critical-start\s*\*\//;
const NON_CRITICAL_END = /\/\*\s*@non-critical-end\s*\*\//;
```

---

## Data Flow

### Scanning Phase (Build Time)

```
1. Plugin config() runs
2. Walk app/ directory recursively
3. For each .scss file:
   ├─ Read file content
   ├─ Test against regex patterns
   ├─ Classify as: critical | non-critical | unmarked
   ├─ Compute relative import path
   └─ Store in Map

4. Build two lists:
   ├─ criticalImports: ["@use '../../components/header/header';", ...]
   └─ nonCriticalImports: ["@use '../../components/footer/footer';", ...]
```

### Generation Phase (Build Time)

```
1. When Sass tries to import _critical.scss:
   ├─ resolveId() intercepts (virtual module)
   ├─ load() generates content:
      - @use "root";
      - @use "typography";
      - @use "flex";
      - @use "colors";
      - @use "spacings";
      - @use "../../components/layout/header/header";  // from markers
      - @use "../../components/post/search/search";     // from markers
   └─ Returns to Sass

2. When Sass tries to import _non-critical.scss:
   ├─ resolveId() intercepts (virtual module)
   ├─ load() generates content:
      - @use "borders";
      - @use "statuses";
      - @use "sizes";
      // Non-critical components (if any exist)
   └─ Returns to Sass

3. Sass compiles the generated content as normal
4. Final CSS includes:
   ├─ Abstracts (inlined)
   └─ Critical components (inlined)
```

---

## Generated Output Examples

### \_critical.scss (Virtual)

```scss
// AUTO-GENERATED by critical-css-scanner plugin
// ⚠️ DO NOT EDIT - Changes will be overwritten

@use "root";
@use "typography";
@use "flex";
@use "colors";
@use "spacings";

// Critical components (detected from /* @critical */ markers)
@use "../../components/layout/header/header";
```

### \_non-critical.scss (Virtual)

```scss
// AUTO-GENERATED by critical-css-scanner plugin
// ⚠️ DO NOT EDIT - Changes will be overwritten

@use "borders";
@use "statuses";
@use "sizes";

// Non-critical components (detected from /* @non-critical */ markers)
// (Currently: none)
```

---

## Plugin Implementation Checklist

### Phase 2.1: Plugin Creation

- [ ] Create `build/plugins/critical-css-scanner.ts`
- [ ] Implement file system scanning (recursive `app/` directory)
- [ ] Implement regex-based marker detection
- [ ] Build critical/non-critical file maps
- [ ] Generate import paths (relative to `app/styles/create/`)

### Phase 2.2: Vite Integration

- [ ] Implement `config()` hook (production builds only)
- [ ] Implement `resolveId()` hook (virtual module interception)
- [ ] Implement `load()` hook (generate scss content)
- [ ] Integrate into `vite.config.ts`
- [ ] Add plugin to exports

### Phase 2.3: Error Handling & Logging

- [ ] Validate import paths can be resolved
- [ ] Log warnings for issues
- [ ] Log summary: files scanned, critical/non-critical breakdown
- [ ] Handle missing files gracefully

### Phase 2.4: Testing & Verification

- [ ] Run `yarn build` - CSS should compile
- [ ] Verify CSS is inlined in production
- [ ] Run `yarn dev` - should stay fast (plugin disabled)
- [ ] Check CSS bundle size unchanged
- [ ] Test on multiple routes

### Phase 2.5: Documentation

- [ ] Update DOCUMENTATION.md with plugin details
- [ ] Update CRITICAL_CSS_DECENTRALIZATION_PLAN.md with Phase 2 completion
- [ ] Add comments to plugin code
- [ ] Document troubleshooting

---

## Why This Approach Works

1. **Performance**: Virtual modules = no disk I/O = fast
2. **Dev Experience**: Dev mode uses existing system = no overhead
3. **Production Optimized**: Plugin only runs when building = no wasted cycles
4. **Maintainability**: Single source of truth (markers in component files)
5. **Abstraction Coverage**: All tokens available everywhere, inlined for performance
6. **Scalability**: Adding new components is automatic (just add marker)
7. **Reversibility**: Can disable plugin and revert to manual imports

---

## Next Steps

1. ✅ Review this plan (current)
2. Create `build/plugins/critical-css-scanner.ts` with full implementation
3. Integrate into `vite.config.ts`
4. Test with `yarn build`
5. Verify CSS inlining works
6. Update documentation

---

**Ready to implement?** Proceed to step 2 above.
