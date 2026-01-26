# Phase 4: Visual Implementation Guide

A quick visual reference for all Phase 4 changes. Use this alongside the detailed documents.

---

## Directory Structure Changes

### BEFORE (Phase 3)

```
app/
├── styles/
│   ├── abstracts/              ← Tokens defined here
│   │   ├── _colors.scss
│   │   ├── _typography.scss
│   │   └── index.scss          ← Exports all abstracts
│   │
│   ├── create/                 ← Developer must know about this ⚠️
│   │   ├── _critical.template.scss     ← Manual edits needed ⚠️
│   │   ├── _non-critical.template.scss ← Manual edits needed ⚠️
│   │   ├── _critical.scss              ← Generated (gitignored)
│   │   ├── _non-critical.scss          ← Generated (gitignored)
│   │   ├── _colors.scss                ← Utility generators
│   │   ├── _typography.scss            ← Utility generators
│   │   └── _index.scss
│   │
│   ├── index.scss
│   └── non-critical-entry.scss
│
└── components/                 ← Components defined here
    ├── layout/
    │   ├── header/
    │   │   └── header.scss    ← Add /* @critical */ if needed
    │   └── footer/
    │       └── footer.scss
    └── post/
        └── search/
            └── search.scss
```

### AFTER (Phase 4)

```
app/
├── .internal/                  ← NEW: Auto-managed, developers don't touch
│   ├── README.md               ← WARNING: Do not edit!
│   └── critical-css/
│       ├── _generated-critical.scss       ← Auto-generated ✨
│       └── _generated-non-critical.scss   ← Auto-generated ✨
│
├── styles/
│   ├── abstracts/              ← Developers add tokens here
│   │   ├── _colors.scss        ← Just add file, export in index.scss
│   │   ├── _typography.scss    ← Auto-imported by plugin
│   │   └── index.scss
│   │
│   ├── create/                 ← ONLY utility generators
│   │   ├── _colors.scss        ← Generates .c-txt-*, .c-bg-* classes
│   │   ├── _typography.scss    ← Generates .tp-w-*, .tp-s-* classes
│   │   ├── _flex.scss          ← Generates flex utilities
│   │   └── _index.scss         ← Just imports utility generators
│   │
│   ├── index.scss              ← Imports .internal/critical-css
│   └── non-critical-entry.scss ← Imports .internal/critical-css
│
└── components/                 ← Developers add components here
    ├── layout/
    │   ├── header/
    │   │   └── header.scss    ← Add /* @critical */ if needed
    │   └── footer/
    │       └── footer.scss    ← Leave unmarked = non-critical
    └── post/
        └── search/
            └── search.scss    ← Leave unmarked = non-critical
```

---

## Developer Workflow Comparison

### BEFORE (Phase 3): Adding a Token

```
Step 1: Create abstract
$ cat > app/styles/abstracts/_shadows.scss << 'EOF'
$shadows: (...)
EOF

Step 2: Export it
$ edit app/styles/abstracts/index.scss
  + Add: @forward "shadows";

Step 3: ⚠️  UPDATE TEMPLATE (manual, error-prone)
$ edit app/styles/create/_critical.template.scss
  + Add: @use "root";
  + Add: @use "shadows";        ← Must add this manually!

Step 4: Wait for plugin to regenerate

Step 5: Test in browser
```

**Result**: 3 files edited, 1 manual step, easy to forget step 3

### AFTER (Phase 4): Adding a Token

```
Step 1: Create abstract
$ cat > app/styles/abstracts/_shadows.scss << 'EOF'
$shadows: (...)
EOF

Step 2: Export it
$ edit app/styles/abstracts/index.scss
  + Add: @forward "shadows";

Step 3: ✅ DONE!
   (Plugin auto-detects and imports)

Step 4: Test in browser (immediately in dev mode)
```

**Result**: 2 files edited, 0 manual steps, automatic ✅

---

## Build System Flow

### BEFORE (Phase 3)

```
Source Files
├── app/styles/abstracts/*.scss     (10 files, all tokens)
├── app/styles/create/_critical.template.scss  (manual, hardcoded)
├── app/styles/create/_non-critical.template.scss (manual)
└── app/components/**/*.scss        (component files)

                    ↓ (Vite build)

Plugin (critical-css-scanner)
├── Scan: Read templates
├── Merge: Templates + detected components
└── Generate: _critical.scss + _non-critical.scss

                    ↓

Output Files (app/styles/create/)
├── _critical.scss       (abstracts + critical components)
└── _non-critical.scss   (abstracts + non-critical components)

                    ↓

SCSS Compilation
├── app/styles/index.scss
│   └── imports create/_index.scss
│       └── imports _critical.scss ← BUG: Also imports non-critical
└── app/styles/non-critical-entry.scss
    └── imports create/non-critical

                    ↓

Result:
├── root-*.css (all CSS, critical + non-critical)
└── non-critical-*.css (empty or duplicate)
```

### AFTER (Phase 4)

```
Source Files
├── app/styles/abstracts/*.scss     (10 files, all tokens)
├── app/components/**/*.scss        (component files, with /* @critical */ markers)
└── No templates needed! ✨

                    ↓ (Vite build)

Plugin (critical-css-scanner)
├── Scan abstracts: List all tokens in app/styles/abstracts/
├── Auto-import: Generate @use statements for ALL
├── Scan components: Find /* @critical */ markers
└── Generate: Two separate files

                    ↓

Output Files (app/.internal/critical-css/)
├── _generated-critical.scss
│   ├── All abstracts (colors, typography, flex, etc.)
│   └── Components marked with /* @critical */
└── _generated-non-critical.scss
    └── Components NOT marked (unmarked by default)

                    ↓

SCSS Compilation
├── app/styles/index.scss
│   ├── imports .internal/critical-css/_generated-critical.scss
│   └── imports create/_index.scss (utilities only)
└── app/styles/non-critical-entry.scss
    ├── imports .internal/critical-css/_generated-non-critical.scss
    └── imports create/_index.scss (utilities only)

                    ↓

Result:
├── root-*.css (critical CSS only, all abstracts + marked components)
└── non-critical-*.css (non-critical components only)
```

---

## File Changes Summary

### DELETE ❌

| File                                            | Reason                                            |
| ----------------------------------------------- | ------------------------------------------------- |
| `app/styles/create/_critical.template.scss`     | Templates no longer needed (pure auto-generation) |
| `app/styles/create/_non-critical.template.scss` | Templates no longer needed                        |

### MODIFY 📝

#### `app/styles/create/_index.scss`

```diff
- /**
-  * CSS Generation from Design Tokens
-  * ...
-  */
- @use "critical";

+ /**
+  * CSS Utility Class Generators
+  * ...
+  */
+ @use "borders";
+ @use "colors";
+ @use "flex";
+ @use "sizes";
+ @use "spacings";
+ @use "statuses";
+ @use "typography";
```

**Key**: Remove critical imports (now in `.internal/`)

---

#### `app/styles/index.scss`

```diff
- @use "create/index" as create;
- @forward "abstracts/spacings";
- @forward "abstracts/colors";
- @forward "abstracts/typography";
- @forward "abstracts/mixins";

+ /**
+  * Main CSS Entry Point (Critical CSS Only)
+  * ...
+  */
+ @use "../.internal/critical-css/generated-critical" as critical;
+ @use "create/index" as create;
```

**Key**: Import abstracts from `.internal/` instead of forwarding

---

#### `app/styles/non-critical-entry.scss`

```diff
- /**
-  * Non-Critical CSS Entry Point (Phase 3)
-  * ...
-  */
- @use "create/non-critical";

+ /**
+  * Non-Critical CSS Entry Point (Phase 4)
+  * ...
+  */
+ @use "../.internal/critical-css/generated-non-critical" as noncritical;
+ @use "create/index" as create;
```

**Key**: Import from `.internal/` and add utility generators

---

### CREATE ✨

#### `app/.internal/README.md`

```markdown
# ⚠️ Internal Build System

This directory contains **auto-managed** files generated by the build process.

**Do not edit these files manually** — they are regenerated on every build.

For adding design tokens: modify `app/styles/abstracts/`
For marking components: add `/* @critical */` to SCSS files

The build system handles everything else automatically.
```

---

#### `app/.internal/critical-css/_generated-critical.scss`

```scss
// AUTO-GENERATED - Do not edit manually

// Abstracts (all auto-imported)
@use "../../styles/abstracts/borders";
@use "../../styles/abstracts/colors";
@use "../../styles/abstracts/dimensions";
@use "../../styles/abstracts/flex";
@use "../../styles/abstracts/functions";
@use "../../styles/abstracts/mixins";
@use "../../styles/abstracts/sizes";
@use "../../styles/abstracts/spacings";
@use "../../styles/abstracts/statuses";
@use "../../styles/abstracts/typography";
@use "../../styles/abstracts/breakpoints";

// Critical Components
@use "../../components/layout/header/header";
```

---

#### `app/.internal/critical-css/_generated-non-critical.scss`

```scss
// AUTO-GENERATED - Do not edit manually

// Non-Critical Components
@use "../../components/layout/footer/footer";
@use "../../components/post/search/search";
```

---

### .gitignore UPDATE

```diff
+ # Phase 4: Auto-managed critical CSS
+ app/.internal/
```

---

## Plugin Refactoring: `vite-plugins/critical-css-scanner.ts`

### High-Level Changes

```diff
// Remove
- async function readTemplate(...)        ❌ Delete
- function generateFromTemplate(...)      ❌ Delete

// Add
+ async function scanAbstracts(...)       ✨ New
+ function generateAbstractImports(...)   ✨ New
+ function generateComponentImports(...) ✨ New

// Modify
  async function regenerateImports()      📝 Call new functions
  async function scanDirectory()          ✅ Keep same
```

### Key Points

1. **Output paths change**:

   ```typescript
   // Before
   stylesDir = path.resolve(appRoot, "styles", "create");

   // After
   stylesDir = path.resolve(appRoot, ".internal", "critical-css");
   ```

2. **File names change**:

   ```typescript
   // Before
   _critical.scss;
   _non - critical.scss;

   // After
   _generated - critical.scss;
   _generated - non - critical.scss;
   ```

3. **New scanning logic**:

   ```typescript
   // New: Scan abstracts directory
   const abstracts = await scanAbstracts(abstractsDir);

   // Existing: Scan components directory
   const components = await scanDirectory(appRoot);

   // New: Generate sections separately
   const abstractSection = generateAbstractImports(abstracts);
   const componentSection = generateComponentImports(components);
   ```

---

## Testing Verification Checklist

### DEV MODE ✅

```bash
yarn dev
```

**What to check**:

- [ ] App loads without errors
- [ ] Styles render correctly
- [ ] console shows: "Found X critical, Y non-critical, Z total"
- [ ] `app/.internal/critical-css/_generated-critical.scss` exists
- [ ] `app/.internal/critical-css/_generated-non-critical.scss` exists
- [ ] Create new abstract file → auto-detected immediately
- [ ] Create new component file → auto-detected immediately
- [ ] Styles update without manual restart (HMR works)

### PROD MODE ✅

```bash
yarn build && yarn start
```

**What to check**:

- [ ] Build completes successfully
- [ ] Two CSS files in output: `root-*.css` and `non-critical-*.css`
- [ ] `root-*.css` contains abstracts + critical components
- [ ] `non-critical-*.css` contains non-critical components
- [ ] Styles render correctly on page load
- [ ] No CSS duplication in HTML source
- [ ] Console shows: "Inlined X KB critical CSS + async-loaded non-critical-\*.css"

---

## Git Workflow

### Commit 1: Plugin Refactor

```bash
git add vite-plugins/critical-css-scanner.ts
git add app/.internal/README.md
git add .gitignore
git commit -m "Phase 4: Auto-import abstracts and move critical CSS to .internal/

- Refactor plugin to auto-scan app/styles/abstracts/
- Output to app/.internal/critical-css/ (hidden from developers)
- Remove template-based generation (pure auto-generated)
- Rename _critical.scss → _generated-critical.scss
- Same component detection (/* @critical */ markers)"
```

### Commit 2: SCSS Updates

```bash
git add app/styles/create/_index.scss
git add app/styles/index.scss
git add app/styles/non-critical-entry.scss
git rm app/styles/create/_critical.template.scss
git rm app/styles/create/_non-critical.template.scss
git commit -m "Phase 4: Update SCSS imports for auto-generated critical CSS

- Import from app/.internal/critical-css/
- Simplify create/_index.scss (utilities only)
- Delete template files (no longer needed)
- Both dev and prod modes working"
```

### Commit 3: Documentation

```bash
git add DOCUMENTATION.md
git add PHASE_4_*.md
git commit -m "Phase 4: Update documentation for simplified workflow

- Remove template editing steps
- Document .internal/ directory
- Simplify token creation guide
- Add implementation phase documentation"
```

---

## Common Questions Answered

### Q: Will my existing code break?

**A**: No. The build produces the same output (two CSS files). Only the internal structure changes.

### Q: Do I need to update my components?

**A**: No. Existing `/* @critical */` markers work exactly the same.

### Q: What if I edit files in `.internal/`?

**A**: They'll be overwritten on next build. Don't do it. The README warns against this.

### Q: How do I add a new token now?

**A**:

1. Create `app/styles/abstracts/_yourtoken.scss`
2. Export in `index.scss`
3. Done! Auto-imported.

### Q: What if something breaks?

**A**: `git revert <commit-hash>` returns to Phase 3. Safe rollback.

---

## Success Indicators

After Phase 4, you'll notice:

✅ No templates in `app/styles/create/` (only utility generators)  
✅ New abstracts are imported automatically (no manual edits)  
✅ `.internal/` directory is clearly marked "do not edit"  
✅ Developer workflow is simpler (fewer files to think about)  
✅ Build output unchanged (still works perfectly)  
✅ All tests pass (same functionality, reorganized)

---

This visual guide complements the detailed documents. Use together for complete understanding.
