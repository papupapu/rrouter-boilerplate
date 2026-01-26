# Phase 4: Auto-Import Abstracts & Reorganize Critical CSS Files

**Status**: Planning
**Target**: Production-ready implementation
**Estimated Work**: 4-6 hours
**Risk Level**: Low (plugin-only changes, isolated from component logic)

---

## Objective

Eliminate manual developer interaction with critical CSS internals:

1. ✅ Auto-detect and import ALL abstracts (no template edits needed)
2. ✅ Move all auto-generated critical CSS logic to `.internal/` directory
3. ✅ Delete template files (pure auto-generation)
4. ✅ Developers only see: `abstracts/` and `components/` directories

---

## Before & After Comparison

### Current State (Phase 3)

```
Developers do:
  1. Create abstract file: app/styles/abstracts/_newToken.scss
  2. Export in abstracts/index.scss
  3. ⚠️ MUST edit app/styles/create/_critical.template.scss (manual, error-prone)
  4. Create component file: app/components/my-comp/my-comp.scss
  5. Add /* @critical */ if needed (or leave unmarked)

Build system does:
  - Scan app/components/ for /* @critical */ markers
  - Generate _critical.scss and _non-critical.scss
  - Hardcoded abstracts in _critical.template.scss
  - Output to: app/styles/create/_*.scss

Files developer sees:
  - ❌ Templates: app/styles/create/_critical.template.scss
  - ❌ Generated files: app/styles/create/_critical.scss (in .gitignore but visible)
  - ❌ Non-critical template: app/styles/create/_non-critical.template.scss
```

### Target State (Phase 4)

```
Developers do:
  1. Create abstract file: app/styles/abstracts/_newToken.scss
  2. Export in abstracts/index.scss
  3. ✅ That's it! Automatic import.
  4. Create component file: app/components/my-comp/my-comp.scss
  5. Add /* @critical */ if needed (or leave unmarked)

Build system does:
  - Scan app/styles/abstracts/ for ALL files
  - Auto-import in _generated-critical.scss (100% automatic)
  - Scan app/components/ for /* @critical */ markers
  - Generate _generated-critical.scss and _generated-non-critical.scss
  - Output to: app/.internal/critical-css/_*.scss

Files developer sees:
  - ✅ Only: app/styles/abstracts/ and app/components/
  - ✅ Hidden: app/.internal/critical-css/ (auto-managed, don't touch)
  - ✅ Deleted: All templates
```

---

## Implementation Plan

### Phase 4.0: Setup (30 minutes)

#### Step 1: Create `.internal/critical-css/` directory structure

```bash
mkdir -p app/.internal/critical-css/
```

#### Step 2: Create `.internal/README.md` (visibility barrier)

```markdown
# ⚠️ Internal Build System

This directory contains **auto-managed** files generated during the build process.

**Do not edit these files manually** — they are regenerated on every `yarn dev` and `yarn build`.

For adding design tokens, modify `app/styles/abstracts/` instead.
For marking components as critical, add `/* @critical */` to component SCSS files.

The build system automatically handles all the rest.
```

#### Step 3: Update `.gitignore`

Add new pattern:

```
# Phase 4: Auto-managed critical CSS (auto-generated)
app/.internal/
```

Remove old patterns (if they exist):

```
# Old patterns to remove
# app/styles/create/_critical.scss
# app/styles/create/_non-critical.scss
```

---

### Phase 4.1: Refactor Plugin (2-3 hours)

**File**: `vite-plugins/critical-css-scanner.ts`

**Changes**:

1. **Auto-scan abstracts instead of templates**
   - Scan `app/styles/abstracts/` for all `.scss` files
   - Auto-import ALL (no selection, no templates)
   - Remove hardcoded abstract list

2. **Change output directory**
   - Old: `app/styles/create/`
   - New: `app/.internal/critical-css/`
   - Rename files:
     - `_critical.scss` → `_generated-critical.scss`
     - `_non-critical.scss` → `_generated-non-critical.scss`

3. **Remove template logic**
   - Delete `readTemplate()` function
   - Delete template file reading code
   - Delete `generateFromTemplate()` function
   - Implement `generateAbstractImports()` (new)
   - Implement `generateComponentImports()` (new)

4. **Update file generation**
   - Generate two files with clear sections:

     ```scss
     // AUTO-GENERATED - Do not edit
     // Generated at: [timestamp]

     // === ABSTRACTS (auto-detected) ===
     @use "../../styles/abstracts/colors";
     @use "../../styles/abstracts/typography";
     // ... all abstracts

     // === CRITICAL COMPONENTS (marked with /* @critical */) ===
     @use "../../components/layout/header/header";
     @use "../../components/search/search";
     ```

5. **Update file watcher**
   - Watch both `app/styles/abstracts/` AND `app/components/`
   - Regenerate on changes to either
   - Same debounce logic (300ms)

6. **Update HMR logic**
   - Send same full-reload message
   - Works with new directory structure

**Key Implementation Details**:

```typescript
interface GeneratedFiles {
  abstracts: string[]; // All abstract filenames
  criticalComponents: string[];
  nonCriticalComponents: string[];
}

async function scanAbstracts(abstractsDir: string): Promise<string[]> {
  // List all .scss files in app/styles/abstracts/
  // Return filenames without .scss extension
  // Skip index.scss
  // Return: ['colors', 'typography', 'flex', ...]
}

function generateAbstractImports(abstracts: string[]): string {
  // Return import block for all abstracts
  // e.g. @use "../../styles/abstracts/colors";
}

function generateComponentImports(files: GeneratedFiles): string {
  // Return import block for critical + non-critical components
  // Separate sections with comments
}

async function regenerateImports() {
  const abstracts = await scanAbstracts(abstractsDir);
  const components = await scanComponents(appRoot); // Existing logic

  const abstractSection = generateAbstractImports(abstracts);
  const componentSection = generateComponentImports(components);

  // Write to app/.internal/critical-css/_generated-critical.scss
  // Write to app/.internal/critical-css/_generated-non-critical.scss
}
```

---

### Phase 4.2: Update SCSS Entry Points (1 hour)

#### File 1: `app/styles/index.scss`

**Current**:

```scss
@use "create/index" as create;
@forward "abstracts/spacings";
@forward "abstracts/colors";
@forward "abstracts/typography";
@forward "abstracts/mixins";
```

**Change to**:

```scss
/**
 * Main CSS Entry Point (Critical CSS Only)
 *
 * This file is compiled to: root-*.css (inlined in <head>)
 *
 * What's imported:
 * 1. All abstracts (design tokens) - auto-detected by plugin
 * 2. Critical components - auto-detected via /* @critical */ markers
 * 3. Utility generators - create/ directory
 *
 * Non-critical components are handled by: app/styles/non-critical-entry.scss
 */

// Auto-generated critical CSS (abstracts + critical components)
@use "../.internal/critical-css/generated-critical" as critical;

// Utility class generators (from design tokens)
@use "create/index" as create;
```

#### File 2: `app/styles/non-critical-entry.scss`

**Current**:

```scss
@use "create/non-critical";
```

**Change to**:

```scss
/**
 * Non-Critical CSS Entry Point
 * 
 * This file is compiled to: non-critical-*.css (async-loaded)
 * 
 * What's imported:
 * 1. Non-critical components - auto-detected (unmarked files)
 * 2. Utility generators - create/ directory
 */

// Auto-generated non-critical components
@use "../.internal/critical-css/generated-non-critical" as noncritical;

// Utility class generators
@use "create/index" as create;
```

#### File 3: `app/styles/create/_index.scss`

**Current**:

```scss
@use "critical";
```

**Change to**:

```scss
/**
 * CSS Utility Class Generators
 * 
 * This file generates utility classes from design token abstracts.
 * It ONLY generates classes, does not include component styles.
 * 
 * Imported by:
 * - app/styles/index.scss (critical path)
 * - app/styles/non-critical-entry.scss (async path)
 * 
 * This allows utility classes to be available in both bundles.
 */

@use "borders";
@use "colors";
@use "flex";
@use "sizes";
@use "spacings";
@use "statuses";
@use "typography";
```

**Key Point**: Remove all abstract imports from here. They're now auto-imported via `generated-critical.scss`.

---

### Phase 4.3: Update Root SCSS File (15 minutes)

**File**: `app/app.scss`

**Current State**: Check if it imports from `styles/index.scss`

**Required**: Should import main entry point

```scss
@use "styles/index";
```

---

### Phase 4.4: Delete Template Files (5 minutes)

**Files to DELETE**:

- ❌ `app/styles/create/_critical.template.scss`
- ❌ `app/styles/create/_non-critical.template.scss`

**Why safe to delete**:

- No longer needed (pure auto-generation)
- No existing code references them
- Plugin logic will be rewritten to not use templates

---

### Phase 4.5: Update Vite Config (15 minutes)

**File**: `vite.config.ts`

**Current**: Import and use `criticalCssScanner()` plugin

**Verify**:

- Plugin is imported: `import { criticalCssScanner } from "./vite-plugins/critical-css-scanner";`
- Plugin is registered: Added to `plugins` array
- No other changes needed (plugin handles all logic internally)

---

### Phase 4.6: Test Development Mode (1 hour)

#### Test 1: Clean dev environment

```bash
rm -rf app/.internal/critical-css/ build/ node_modules/.vite/
yarn dev
```

**Expected output**:

```
[Critical CSS Scanner] 🔍 Scanning for markers in: [path]/app
[Critical CSS Scanner] 📚 Detected abstracts:
  ✓ colors
  ✓ typography
  ✓ flex
  ... (all abstracts listed)
[Critical CSS Scanner] ✅ Auto-generated critical CSS imports
[Critical CSS Scanner]    Found 1 critical, 2 non-critical, 3 total components
```

**Verification**:

- ✅ Files created: `app/.internal/critical-css/_generated-critical.scss`
- ✅ Files created: `app/.internal/critical-css/_generated-non-critical.scss`
- ✅ Browser loads without errors
- ✅ Styles render correctly

#### Test 2: Add new abstract while dev server running

```bash
cat > app/styles/abstracts/_shadows.scss << 'EOF'
$shadows: (
  sm: 0 1px 2px rgba(0, 0, 0, 0.05),
  md: 0 4px 6px rgba(0, 0, 0, 0.1),
);
EOF
```

**Update**: `app/styles/abstracts/index.scss`

```scss
@forward "shadows";
```

**Expected**:

- ✅ File watcher detects change (300ms debounce)
- ✅ Plugin regenerates both files
- ✅ Console shows updated abstract count
- ✅ No need to restart dev server

#### Test 3: Add new component with /_ @critical _/

```bash
cat > app/components/example/example.scss << 'EOF'
/* @critical */

.example {
  color: var(--c-txt--primary);
}
EOF
```

**Expected**:

- ✅ Detected as critical component
- ✅ Imported in `_generated-critical.scss`
- ✅ Console shows: "Found 2 critical, 2 non-critical"
- ✅ HMR triggers full reload
- ✅ Styles appear in browser

#### Test 4: Add component without marker (non-critical)

```bash
cat > app/components/other/other.scss << 'EOF'
.other {
  color: var(--c-txt--secondary);
}
EOF
```

**Expected**:

- ✅ Detected as non-critical component
- ✅ Imported in `_generated-non-critical.scss`
- ✅ Console shows: "Found 2 critical, 3 non-critical"

---

### Phase 4.7: Test Production Build (1.5 hours)

#### Test 1: Clean build

```bash
yarn build
```

**Expected**:

```
[Critical CSS Scanner] 🔍 Scanning for markers in: [path]/app
[Critical CSS Scanner] 📚 Detected abstracts: 11 total
[Critical CSS Scanner] ✅ Auto-generated critical CSS imports
[Critical CSS Scanner]    Found 1 critical, 2 non-critical, 3 total components

✓ 32 modules transformed...
✓ built in Xs

[CSS Compiled Separately] ✅ Compiled non-critical CSS
[CSS Compiled Separately]    File: non-critical-*.css
[CSS Compiled Separately]    Size: X.XX KB
```

**Verification**:

- ✅ Build completes without errors
- ✅ Two CSS files in output: `root-*.css` and `non-critical-*.css`
- ✅ `app/.internal/critical-css/` directory created during build
- ✅ Generated files in build output or temporary location

#### Test 2: Production server

```bash
yarn start
```

**Open browser**: `http://localhost:3000`

**Expected**:

```
[Critical CSS] 📄 Critical CSS: root-*.css (X.XX KB)
[Critical CSS] 📄 Non-critical CSS: non-critical-*.css (X.XX KB)
[Critical CSS] ✅ Inlined X.XX KB critical CSS + async-loaded non-critical-*.css
```

**Verification**:

- ✅ Page loads without errors
- ✅ Styles render correctly
- ✅ Critical CSS inlined in `<style id="critical-css">`
- ✅ Non-critical CSS loaded via `<link>` with lazy-loading
- ✅ No CSS duplication in page source

#### Test 3: Build multiple times

```bash
rm -rf build/ && yarn build && rm -rf build/ && yarn build
```

**Verification**:

- ✅ Build succeeds both times
- ✅ Files are generated identically
- ✅ No stale files or conflicts

---

### Phase 4.8: Update Documentation (1 hour)

**File**: `DOCUMENTATION.md`

**Changes**:

1. **Update CSS Token System section**:
   - Remove mention of templates
   - Update file structure to show `.internal/` directory
   - Simplify: "All abstracts are automatically critical"

2. **Update Adding New Tokens section**:
   - Remove step "manually edit template"
   - New simplified steps:
     1. Create abstract file
     2. Export in `index.scss`
     3. Done!

3. **Add new "Marking Components" section**:
   - Only mention: Add `/* @critical */` to component file
   - Everything else is automatic

4. **Remove Phase 2/3/4 references**:
   - Keep final architecture
   - Remove historical evolution (can reference PHASE_4 doc if needed)

**File**: Create new `PHASE_4_IMPLEMENTATION.md`

Document the full migration for future reference (optional).

---

## Testing Checklist

### Before Merging

- [ ] `yarn dev` starts without errors
- [ ] New abstract detected automatically
- [ ] New critical component detected automatically
- [ ] New non-critical component detected automatically
- [ ] HMR works without restart
- [ ] File watcher debounces correctly (300ms)
- [ ] Browser renders styles correctly

### Production Build

- [ ] `yarn build` completes successfully
- [ ] Two CSS files generated (`root-*.css` and `non-critical-*.css`)
- [ ] `yarn start` works without errors
- [ ] Critical CSS inlined in page source
- [ ] Non-critical CSS lazy-loaded
- [ ] No CSS duplication
- [ ] CSS sizes reasonable (critical ~5-6KB, non-critical ~4-5KB)

### Edge Cases

- [ ] Adding abstract while dev server running → detects automatically
- [ ] Deleting abstract file → removed from imports automatically
- [ ] Renaming abstract file → updates correctly
- [ ] Multiple new components simultaneously → all detected
- [ ] Circular imports → no infinite loops
- [ ] Empty components directory → no errors

---

## Git Strategy

### Commit 1: Directory Setup & Plugin Refactor

```
git add vite-plugins/critical-css-scanner.ts
git add app/.internal/README.md
git add .gitignore
git commit -m "Phase 4: Refactor critical CSS scanner for auto-abstract import

- Move output from app/styles/create/ to app/.internal/critical-css/
- Auto-scan app/styles/abstracts/ for all tokens
- Remove template-based generation (pure auto-generated now)
- Rename generated files: _critical.scss → _generated-critical.scss
- Same component detection logic (/* @critical */ markers)
- Dev and prod fully tested"
```

### Commit 2: SCSS Entry Point Updates

```
git add app/styles/index.scss
git add app/styles/non-critical-entry.scss
git add app/styles/create/_index.scss
git remove app/styles/create/_critical.template.scss
git remove app/styles/create/_non-critical.template.scss
git commit -m "Phase 4: Update SCSS imports to use auto-generated critical CSS

- Import auto-generated abstracts + critical components from .internal/
- Simplify create/_index.scss to utility generators only
- Remove template files (no longer needed)
- Both critical and non-critical entry points working"
```

### Commit 3: Documentation

```
git add DOCUMENTATION.md
git add PHASE_4_IMPLEMENTATION.md
git commit -m "Phase 4: Update documentation

- Simplify token creation workflow (no template edits needed)
- Document new directory structure with .internal/
- Remove template mentions
- Add .internal/README.md warning"
```

---

## Rollback Plan

If issues arise:

```bash
git revert <commit-hash>
```

This restores:

- Previous plugin logic
- Templates (can re-enable)
- Old directory structure
- Previous import statements

---

## Success Criteria

**Phase 4 is complete when:**

✅ Developers add abstracts without editing templates  
✅ Developers add components without managing critical CSS files  
✅ `.internal/critical-css/` is completely hidden from view  
✅ Both dev and prod modes work perfectly  
✅ Documentation reflects simplified workflow  
✅ All tests pass

**Result**: Zero friction critical CSS management. Developers can't mess it up because they're never given the opportunity.

---

## Timeline Estimate

| Task                          | Duration       | Notes                                |
| ----------------------------- | -------------- | ------------------------------------ |
| Phase 4.0: Setup              | 30 min         | Create directories, update gitignore |
| Phase 4.1: Plugin refactor    | 2-3 hrs        | Most complex work                    |
| Phase 4.2: SCSS updates       | 1 hr           | File changes, delete templates       |
| Phase 4.3: Root SCSS          | 15 min         | Verification only                    |
| Phase 4.4: Delete templates   | 5 min          | Cleanup                              |
| Phase 4.5: Vite config        | 15 min         | Verification only                    |
| Phase 4.6: Dev testing        | 1 hr           | Extensive manual testing             |
| Phase 4.7: Production testing | 1.5 hrs        | Build + server testing               |
| Phase 4.8: Documentation      | 1 hr           | Update guides                        |
| **Total**                     | **~7-8 hours** | Can split across sessions            |

---

## Next Steps

1. Confirm this plan looks good
2. I'll implement Phase 4.0-4.2 (setup + plugin refactor)
3. Run through testing checklist
4. Final documentation

Any questions or changes to the plan before I start?
