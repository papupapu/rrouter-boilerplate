# Critical CSS Implementation Plan - Option 1: Custom SSR Middleware

**Status**: Ready for Implementation  
**Effort**: 2-4 hours (implementation + testing)  
**Target Date**: January 24, 2026  
**Approach**: Custom SSR middleware with HTML buffering + Beasties processing

---

## Prerequisites

### Node.js Version

**Required**: Node 22

**Important**: This project requires Node 22. When opening a new console instance, you **MUST** run:

```bash
nvm use 22
```

**Why**: The project may have incompatibilities with other Node versions. Always verify the Node version before running commands:

```bash
node --version  # Should output v22.x.x
```

**Tip**: Add this to your shell profile (`.zshrc` or `.bashrc`) to auto-switch:

```bash
# In ~/.zshrc
cd /Users/giancarlo.gerbaz/dev/papu/rrouter/rrouter-boilerplate && nvm use 22
```

---

## Overview

Implement a custom middleware layer in the React Router SSR pipeline to:

1. Buffer HTML chunks until React's shell is ready
2. Apply Beasties processing to extract and inline critical CSS
3. Maintain streaming for non-critical content and interactive features
4. Preserve bot detection logic for SEO

**Key Insight**: React Router v7.12.0 streams HTML in chunks, so we cannot apply Beasties to a complete HTML document directly. The solution is to buffer the shell (initial HTML until `onShellReady` fires), process it with Beasties, then resume streaming.

---

## Current Architecture

### SSR Entry Point

- **File**: `build/server/index.js` (compiled from source)
- **Function**: `renderToPipeableStream()` with React Router integration
- **Streaming**: Uses `onShellReady` (browsers) and `onAllReady` (bots) callbacks
- **Response**: Returns a `ReadableStream` object

### Build Configuration

- **File**: `react-router.config.ts`
- **Setting**: `ssr: true`

### Beasties Setup

- **Installed**: `beasties@0.4.1` and `vite-plugin-beasties@0.4.1`
- **Currently**: Plugin configured but not active (Vite hook doesn't align with streaming SSR)
- **Config**: `preload: "swap"`, `compress: true`, `external: true`, `fonts: true`

### Current CSS Delivery

- **Bundle**: `build/client/assets/root-*.css` (16.42 KB)
- **Loading**: External `<link rel="stylesheet">` tag
- **Status**: Not optimal for FCP

---

## Implementation Steps

### Step 1: Create Beasties Processor Utility

**File to create**: `app/utils/beasties-processor.ts`

**Purpose**: Wrapper around Beasties that can process HTML strings in the SSR pipeline

**Content**:

```typescript
import { Beasties } from "beasties";

let processor: Beasties | null = null;

/**
 * Get or create Beasties processor instance
 * Only instantiate in production builds
 */
function getProcessor(): Beasties | null {
  if (import.meta.env.PROD) {
    if (!processor) {
      processor = new Beasties({
        preload: "swap",
        compress: true,
        external: true,
        fonts: true,
      });
    }
    return processor;
  }
  return null;
}

/**
 * Process HTML to extract and inline critical CSS
 * @param html - Complete HTML string (typically the shell)
 * @returns Processed HTML with critical CSS inlined
 */
export async function processCriticalCSS(html: string): Promise<string> {
  const processor = getProcessor();

  if (!processor) {
    // In development, return HTML as-is
    return html;
  }

  try {
    const processed = await processor.process(html);
    return processed;
  } catch (error) {
    console.error("Beasties processing failed:", error);
    // Fallback: return original HTML if processing fails
    return html;
  }
}

/**
 * Reset processor (useful for testing)
 */
export function resetProcessor(): void {
  processor = null;
}
```

**Considerations**:

- Only instantiate Beasties in production (`import.meta.env.PROD`)
- In development, return HTML unchanged to avoid overhead
- Add error handling to prevent crashes if Beasties fails
- Cache processor instance to avoid recreating it on every request

---

### Step 2: Modify Server Entry Point

**File to modify**: `build/server/index.js` (after running `yarn build`)

**OR** (Better approach): Create `app/entry.server.tsx` to override the server entry

**Note**: Since `build/server/index.js` is compiled output, we should NOT edit it directly. Instead, locate the source file and modify it, then rebuild.

**Search for**:

- Look for `renderToPipeableStream` call
- Find `onShellReady` callback (around line 20-30)
- Check for any Express/Remix server setup

**What to modify**:

Add HTML buffering logic:

```typescript
import { processCriticalCSS } from "./utils/beasties-processor";

// Instead of directly piping to response:
// OLD CODE:
// stream.pipe(res);

// NEW CODE:
const chunks: Buffer[] = [];
let shellSent = false;

stream.on("data", async (chunk: Buffer) => {
  if (!shellSent) {
    chunks.push(chunk);
  } else {
    res.write(chunk);
  }
});

stream.on("end", async () => {
  if (!shellSent) {
    // Buffer received, now process with Beasties
    const html = Buffer.concat(chunks).toString("utf-8");
    const processed = await processCriticalCSS(html);
    res.write(processed);
  }
  res.end();
});

// Trigger shell sending at onShellReady
onShellReady: () => {
  shellSent = true;
  // Process buffered chunks here
};
```

**Detailed changes**:

1. Import `processCriticalCSS` from the utility
2. Add event listeners to stream instead of direct pipe
3. Buffer chunks until `onShellReady` fires
4. Process buffered HTML with Beasties
5. Resume streaming for suspension boundaries
6. Handle errors gracefully

---

### Step 3: Configure Vite for Source Map

**File**: `vite.config.ts`

**Current state**: Beasties plugin is configured but targeting `transformIndexHtml`

**Change needed**: This is optional—the plugin won't hurt, but it won't activate either. We can leave it as-is since our custom middleware takes precedence.

---

### Step 4: Rebuild and Test

**Command**:

```bash
nvm use 22
yarn build
```

**What happens**:

1. TypeScript is compiled (including new `app/utils/beasties-processor.ts`)
2. Server bundle is regenerated with new logic
3. CSS is still bundled as before (16.42 KB)

---

### Step 5: Verify Behavior

**Local Testing** (Development):

```bash
yarn dev
# Open http://localhost:5173
# In DevTools:
# - Network: CSS still loads externally (expected in dev)
# - No overhead from Beasties processor
```

**Production Testing**:

```bash
yarn build
yarn start
# Open http://localhost:3000
# In DevTools:
# - Network: Check for <style> tag in <head> with critical CSS
# - Elements: Inspect <head> for inlined critical CSS
# - Lighthouse: Measure FCP before/after (run 3x for average)
```

---

### Step 6: Measure Performance

**Using Lighthouse** (Chrome DevTools):

1. Open DevTools (F12 → Lighthouse tab)
2. Run audit with "Throttling: Slow 4G" for realistic conditions
3. Record:
   - **Before**: Current FCP (with external CSS)
   - **After**: New FCP (with inlined critical CSS)

**Expected improvement**: 15-40% FCP reduction (depends on CSS size and network)

**Using WebPageTest** (external tool):

```
1. Go to https://www.webpagetest.org/
2. Enter: http://localhost:3000
3. Test from: Sydney (Australia) - realistic latency
4. Compare metrics before/after
```

---

## File Changes Summary

### New Files

| File                                  | Purpose                              |
| ------------------------------------- | ------------------------------------ |
| `app/utils/beasties-processor.ts`     | Beasties wrapper for HTML processing |
| `CRITICAL_CSS_IMPLEMENTATION_PLAN.md` | This plan document                   |

### Modified Files

| File                    | Changes                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `build/server/index.js` | Add HTML buffering and Beasties processing (auto-generated from source) |
| `app/entry.server.tsx`  | Source file that generates the above (find and modify, then rebuild)    |

### No Changes Needed

| File                                   | Reason                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `vite.config.ts`                       | Beasties plugin config is already in place; custom middleware takes precedence |
| `app/styles/create/_critical.scss`     | Already created; no changes                                                    |
| `app/styles/create/_non-critical.scss` | Already created; no changes                                                    |
| `react-router.config.ts`               | SSR already enabled; no changes                                                |

---

## Key Considerations

### 1. Streaming vs. Buffering Trade-off

**What happens**:

- Shell HTML is buffered until complete (typically <50 KB)
- Shell is processed with Beasties (adds ~10-50ms latency)
- Critical CSS is inlined in head
- Subsequent suspension boundaries stream normally

**Impact**:

- ✅ FCP improvement: 15-40% (critical CSS inlined)
- ⚠️ TTFB slightly delayed: +10-50ms (acceptable for FCP gain)
- ✅ Streaming preserved: Non-critical content still streams

### 2. Bot vs. Browser Logic

**Current behavior** (already in code):

- Bots: Use `onAllReady` (waits for complete render)
- Browsers: Use `onShellReady` (streams immediately)

**After change**:

- Bots: Full HTML buffered → Beasties processes → sent complete
- Browsers: Shell buffered → Beasties processes → head sent + body streams

**Result**: Both get critical CSS inlined ✅

### 3. CSS Bundle Size

**Current**: 16.42 KB critical + non-critical combined

**If inlining**: Adding inline `<style>` tag increases HTML size by ~16 KB

**Trade-off**:

- ❌ HTML response slightly larger
- ✅ No additional request needed for CSS
- ✅ Critical styles available immediately (FCP)
- ✅ Non-critical loads async with `preload: "swap"`

**Note**: Consider if CSS should be split further (e.g., by route). Beasties will handle intelligently.

### 4. Error Handling

**If Beasties processing fails**:

- Fallback: Original HTML returned (CSS loads externally, page still works)
- No crashes, graceful degradation ✅

**If buffer grows too large**:

- Set timeout: If shell takes >5 seconds, send as-is
- Or: Stream non-buffered content to prevent memory bloat

---

## Testing Checklist

Before marking complete:

- [ ] Utility file created and imports correctly
- [ ] Build succeeds: `yarn build` (no errors)
- [ ] Development mode works: `yarn dev` (no overhead)
- [ ] Production mode works: `yarn build && yarn start`
- [ ] HTML loads without errors in browser
- [ ] DevTools shows no JavaScript errors
- [ ] Lighthouse FCP improves by 15%+ (or measure actual improvement)
- [ ] All routes render: `/` (home), `/about`, `/post`
- [ ] CSS is correctly applied on all routes
- [ ] No layout shift or unstyled content flash
- [ ] Response headers look normal (no extra delays)

---

## Rollback Plan

If issues arise:

1. **Remove Beasties processing**: Comment out the buffering logic in server entry
2. **Revert to external CSS**: Run `yarn build` again
3. **Verify**: `yarn start` should work with original streaming behavior

---

## Next Steps After Implementation

1. **Measure**: Run Lighthouse on each route; document FCP before/after
2. **Monitor**: Add performance monitoring in production (e.g., Web Vitals)
3. **Optimize**: If CSS is still large, consider route-based CSS splitting
4. **Document**: Update `DOCUMENTATION.md` with critical CSS delivery explanation

---

## Resources & References

- **Beasties Docs**: https://github.com/nozomuuuu/beasties
- **React Router SSR**: https://reactrouter.com/
- **Critical CSS Concept**: https://web.dev/critical-path-rendering/
- **Lighthouse Guide**: https://developers.google.com/web/tools/lighthouse

---

**Created**: January 24, 2026  
**Status**: Ready for Implementation  
**Owner**: [Your Name]  
**Branch**: `critical-css`
