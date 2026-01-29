# Fetch Error Handling Implementation Plan

> Precise, elegant error handling system for data-fetching utilities with granular error classification, severity-ordered aggregation, and rich error context.

**Status**: Phase 3 In Progress 🚀  
**Branch**: `dummyjson-error-handling`  
**Last Updated**: 29 Gennaio 2026  
**Commits**:

- `fd6b173` - Plan of action
- `24e08d4` - Phase 2: Implement error handling system in service layer
- `c3ae906` - Update plan: Phase 1 & 2 complete
- `7864c3f` - Type home route loader with FetchResponse<HomeData>

## Scope

### What's Included

1. **Error Type System** - Centralized error definitions and types
   - Error classification (network, parse, unknown)
   - Error severity (critical, warning)
   - Error codes (operation-specific)
   - Discriminated union response types

2. **Error Logging Utility** - Centralized error tracking
   - Structured error logging with context metadata
   - Environment-aware logging (dev vs production)
   - Foundation for external error tracking integration

3. **Error Detection Utility** - Smart error classification
   - Automatic error type detection from exceptions
   - Severity determination based on operation criticality
   - Retriability assessment (network vs permanent failures)
   - User-friendly error message generation

4. **Service Layer Refactoring** - All data-fetching utilities
   - `getCategories.tsx` - Categories fetch with CRITICAL severity
   - `getProductsByCategory.tsx` - Products fetch with WARNING severity
   - `home.tsx` - Orchestration with error aggregation and severity sorting

5. **UI Error Rendering** - Per-route error handling with reusable components
   - `ErrorPage.tsx` - Full-page error for CRITICAL failures (marked `/* @critical */`)
   - `ErrorAlert.tsx` - Multi-error list for WARNING failures with inline retry buttons
   - `ErrorBanner.tsx` - Dismissible warning banner for non-blocking errors
   - Error component SCSS using design tokens (`$bg-error`, `$txt-error`, `$bg-warning`)
   - Route components passing `loaderData` to views
   - View components inspecting `FetchResponse` status and rendering accordingly
   - Inline retry handlers using window.location.reload() for retriable errors
   - Error helper utilities for clean, testable error inspection logic

### What's NOT Included

- Global error context/state management (future enhancement)
- Error recovery/retry with exponential backoff (future enhancement)
- i18n/localization for error messages (plain English)
- External error tracking service integration (foundation provided)
- Toast/notification system for errors (future enhancement)
- Error metrics and monitoring (future enhancement)

---

## Intents

### Primary Intent

Provide clients with **precise, actionable error information** that enables intelligent error handling decisions based on:

- **What failed** (error code + operation)
- **Why it failed** (error type: network, parse, unknown)
- **How critical** (severity: critical blocks all data, warning is partial)
- **Can we retry** (retriable flag distinguishes transient from permanent)
- **When it happened** (timestamp for correlation)
- **Additional context** (operation, data source, affected category)

### Secondary Intents

1. **Centralized Error Tracking** - Single source of truth for error logging across all services
2. **Partial Success Support** - Return data when available, even if some operations fail
3. **Severity-Ordered Errors** - Critical errors reported first, enabling predictable client behavior
4. **Extensibility** - Foundation for future retry logic, external tracking (Sentry, etc.), and metrics

---

## Error Types & Classification

### ErrorType Enum

Classifies the nature of the failure:

```typescript
"NETWORK_ERROR"; // Connection failed, fetch blocked, timeout
"PARSE_ERROR"; // Invalid JSON, malformed response
"UNKNOWN_ERROR"; // Unexpected exception, unclassifiable
```

### ErrorSeverity Enum

Determines impact on data availability:

```typescript
"CRITICAL"; // Operation completely prevents data (e.g., categories list unavailable)
"WARNING"; // Data partially available (e.g., one product category failed but others OK)
```

### ErrorCode Enum

Operation-level identifiers:

```typescript
"CATEGORIES_FETCH_FAILED"; // getCategories failed entirely
"TOP_PRODUCTS_FETCH_FAILED"; // Top 3 category products failed
"PRODUCTS_FETCH_FAILED"; // Individual category products failed
"UNKNOWN_ERROR"; // Fallback for unclassified errors
```

### FetchError Interface

Complete error information:

```typescript
{
  code: ErrorCode; // Which operation failed
  type: ErrorType; // How it failed (network/parse/unknown)
  severity: ErrorSeverity; // Impact on data (critical/warning)
  message: string; // User-friendly description
  timestamp: number; // When it occurred (client time, ms)
  retriable: boolean; // Should caller retry? (network=yes, parse=no)
}
```

### ErrorContext Interface

Metadata for logging and debugging:

```typescript
{
  operation?: string;           // "getCategories", "getProductsByCategory"
  dataSource?: string;          // "dummyjson"
  category?: string;            // For product fetches: slug/name
}
```

### Response Discriminated Union

Type-safe success/error distinction:

```typescript
// Success variant
{
  status: "success";
  data: T;
  errors: [];
}

// Error variant (may include partial data)
{
  status: "error";
  data: T | null;
  errors: FetchError[];  // Sorted by severity (CRITICAL first)
}
```

---

## Service Behavior

### getCategories

- **Severity**: CRITICAL (categories list is foundational)
- **Failure Impact**: If it fails, entire home page data is unavailable
- **Return**:
  - Success: `{status: "success", data: categories[], errors: []}`
  - Error: `{status: "error", data: null, errors: [FetchError]}`

### getProductsByCategory

- **Severity**: WARNING (individual category products are optional)
- **Failure Impact**: If it fails, that category is skipped, others proceed
- **Return**:
  - Success: `{status: "success", data: products[], errors: []}`
  - Error: `{status: "error", data: null, errors: [FetchError]}`

### fetchHomeData

- **Orchestration**: Combines categories + top products + regular products
- **Partial Success**: Returns whatever succeeded + all errors
- **Error Aggregation**: Collects errors from all child operations
- **Severity Sorting**: CRITICAL errors first, then WARNING
- **Status Logic**: `status: "error"` if `errors.length > 0`
- **Return Structure**:
  ```typescript
  {
    status: "success" | "error";
    data: {
      categories: Category[];
      topCategoriesProducts: Record<string, Product[]>;
      categoriesProducts: Record<string, Product[]>;
    };
    errors: FetchError[];  // Severity-sorted
  }
  ```

---

## Implementation Plan

### ✅ Phase 1: Type Definitions & Utilities (COMPLETE)

**Files Created**:

1. **app/utils/errorTypes.ts** ✅
   - ErrorType enum (NETWORK_ERROR, PARSE_ERROR, UNKNOWN_ERROR)
   - ErrorSeverity enum (CRITICAL, WARNING)
   - ErrorCode enum (CATEGORIES_FETCH_FAILED, TOP_PRODUCTS_FETCH_FAILED, PRODUCTS_FETCH_FAILED, UNKNOWN_ERROR)
   - FetchError interface with code, type, severity, message, timestamp, retriable
   - ErrorContext interface with operation, dataSource, category
   - FetchResponse<T> discriminated union type

2. **app/utils/logger.ts** ✅
   - `logError()` function with dev/prod logging
   - Returns `{timestamp: number}` for use in FetchError
   - Foundation for external error tracking integration

3. **app/utils/errorDetector.ts** ✅
   - `detectErrorType()` - Classifies TypeError → network, SyntaxError → parse
   - `determineSeverity()` - Categories → CRITICAL, products → WARNING
   - `isRetriable()` - Returns true for NETWORK_ERROR only
   - `generateMessage()` - Generates user-friendly messages per error type

### ✅ Phase 2: Service Layer Refactoring (COMPLETE)

**Files Updated**:

1. **app/services/utils/getCategories.tsx** ✅
   - Imports error utilities (errorDetector, logger, errorTypes)
   - Refactored try/catch to use error detector
   - Returns FetchResponse<Category[]> discriminated union
   - Calls logger with operation context (operation: "getCategories", dataSource: "dummyjson")
   - ErrorCode: CATEGORIES_FETCH_FAILED with CRITICAL severity

2. **app/services/utils/getProductsByCategory.tsx** ✅
   - Imports error utilities
   - Refactored try/catch to use error detector
   - Returns FetchResponse<Product[]> discriminated union
   - Calls logger with category context (includes category slug)
   - ErrorCode: PRODUCTS_FETCH_FAILED with WARNING severity
   - Proper type handling for Product interface

3. **app/services/home.tsx** ✅
   - Updated getCategories/getProductsByCategory call signatures
   - Implemented error collection in errors[] array (partial success)
   - Implemented `sortErrorsBySeverity()` function (CRITICAL before WARNING)
   - Updated `fetchProductsForCategories()` to collect and return errors
   - Proper early return if categories fail (CRITICAL)
   - Returns FetchResponse<HomeData> with aggregated errors
   - Status logic: "error" if any errors exist, "success" otherwise
   - Exports HomeData interface for type safety

### Phase 3: UI Error Handling & Rendering (IN PROGRESS)

**Files Created**:

1. **app/components/error/ErrorPage.tsx** (IN PROGRESS)
   - Full-page error component for CRITICAL failures
   - Displays primary error message + timestamp
   - Shows retry button for retriable errors only
   - Marked with `/* @critical */` for critical CSS extraction
   - Accepts `error: FetchError` + optional `onRetry: () => void`

2. **app/components/error/ErrorAlert.tsx** (IN PROGRESS)
   - Multi-error list component for WARNING severity errors
   - Renders list of errors with code, type, and message
   - Inline retry buttons for each retriable error
   - Dismissible alert container
   - Accepts `errors: FetchError[]` + optional `onRetry: (error: FetchError) => void`

3. **app/components/error/ErrorBanner.tsx** (IN PROGRESS)
   - Dismissible warning banner for top-of-page error notifications
   - Used for non-blocking, non-critical errors
   - Accepts `errors: FetchError[]` + `onDismiss: () => void`

4. **app/components/error/** - SCSS files (IN PROGRESS)
   - `error-page.scss` - Critical error page styling
   - `error-alert.scss` - Warning alert styling
   - `error-banner.scss` - Banner styling
   - Uses design tokens: `$bg-error`, `$txt-error`, `$bg-warning`, `$txt-warning`, `$txt-error-dark`

5. **app/utils/errorHelpers.ts** (IN PROGRESS)
   - `hasCriticalError(errors: FetchError[]): boolean` - Check if any CRITICAL error exists
   - `getRetriableErrors(errors: FetchError[]): FetchError[]` - Filter retriable errors
   - `extractErrorsByCode(errors: FetchError[], code: ErrorCode): FetchError[]` - Find errors by code
   - `getCriticalError(errors: FetchError[]): FetchError | undefined` - Get first CRITICAL error

**Files Updated**:

1. **app/routes/home.tsx** (IN PROGRESS)
   - Destructure `loaderData` from `Route.ComponentProps`
   - Pass `data={loaderData}` to `<Home>` component

2. **app/routes/post.tsx** (IN PROGRESS)
   - Similar update to pass `loaderData` to post view

3. **app/views/home/home.tsx** (IN PROGRESS)
   - Accept `data: FetchResponse<HomeData>` prop
   - Inspect `data.status` and `data.errors`
   - Render `ErrorPage` if CRITICAL error + `data.data === null`
   - Render `ErrorAlert` + partial data if WARNING errors + `data.data !== null`
   - Render normal content for `status: "success"`
   - Wire `onRetry` handlers to `ErrorAlert` (window.location.reload())

4. **app/views/post/post.tsx** (IN PROGRESS)
   - Similar error handling pattern to home view

### Phase 4: Testing & Verification (PENDING)

**Tasks**:

- [ ] Manual testing in dev mode (dev server running)
- [ ] Browser testing: verify error UI renders correctly
- [ ] Test CRITICAL error path (categories fail → ErrorPage shown)
- [ ] Test WARNING error path (products fail → ErrorAlert shown + partial data)
- [ ] Test retry buttons trigger page reload
- [ ] Network simulation: trigger network error detection via DevTools
- [ ] Invalid response test: verify parse error detection
- [ ] Partial success test: verify one product category failure doesn't block others
- [ ] Verify ErrorPage marked `/* @critical */` extracted to critical CSS
- [ ] Verify error components integrate with layout without breaking layout

---

## Todo List

### Phase 1: Type System & Logging Infrastructure

- [x] Create `app/utils/errorTypes.ts`
  - [x] Define ErrorType enum
  - [x] Define ErrorSeverity enum
  - [x] Define ErrorCode enum
  - [x] Define FetchError interface
  - [x] Define ErrorContext interface
  - [x] Export discriminated union types

- [x] Create `app/utils/logger.ts`
  - [x] Implement logError function with dev/prod awareness
  - [x] Capture error context metadata
  - [x] Return timestamp for FetchError

- [x] Create `app/utils/errorDetector.ts`
  - [x] Implement detectErrorType function (TypeError → network, SyntaxError → parse)
  - [x] Implement determineSeverity function (categories → critical, products → warning)
  - [x] Implement isRetriable function
  - [x] Implement generateMessage function with user-friendly text

### Phase 2: Service Layer Refactoring

- [x] Update `app/services/utils/getCategories.tsx`
  - [x] Import error utilities
  - [x] Refactor try/catch to use error detector
  - [x] Return discriminated union response
  - [x] Call logger with operation context

- [x] Update `app/services/utils/getProductsByCategory.tsx`
  - [x] Import error utilities
  - [x] Refactor try/catch to use error detector
  - [x] Return discriminated union response
  - [x] Call logger with category context

- [x] Refactor `app/services/home.tsx`
  - [x] Update getCategories call to new signature
  - [x] Update getProductsByCategory calls to new signature
  - [x] Implement error collection in errors[] array
  - [x] Sort errors by severity (CRITICAL before WARNING)
  - [x] Return aggregated response with errors array
  - [x] Implement status logic: "error" if any errors

### Phase 3: UI Error Handling & Rendering

- [ ] Create `app/components/error/ErrorPage.tsx`
  - [ ] Component structure with error display
  - [ ] Mark with `/* @critical */`
  - [ ] Retry button for retriable errors

- [ ] Create `app/components/error/ErrorAlert.tsx`
  - [ ] Multi-error list rendering
  - [ ] Inline retry buttons per error
  - [ ] Dismissible container

- [ ] Create `app/components/error/ErrorBanner.tsx`
  - [ ] Banner component structure
  - [ ] Dismissible functionality

- [ ] Create SCSS files for error components
  - [ ] `error-page.scss` with `/* @critical */`
  - [ ] `error-alert.scss`
  - [ ] `error-banner.scss`
  - [ ] Use design tokens for colors

- [ ] Create `app/utils/errorHelpers.ts`
  - [ ] Implement helper functions for error inspection

- [ ] Update `app/routes/home.tsx`
  - [ ] Pass loaderData to Home view

- [ ] Update `app/routes/post.tsx`
  - [ ] Pass loaderData to Post view

- [ ] Update `app/views/home/home.tsx`
  - [ ] Accept FetchResponse data prop
  - [ ] Handle CRITICAL error path
  - [ ] Handle WARNING error path
  - [ ] Wire retry handlers

- [ ] Update `app/views/post/post.tsx`
  - [ ] Similar error handling to home view

### Phase 4: Testing & Verification

- [ ] TypeScript compilation check
- [ ] Manual testing: verify error UI renders correctly
  - [ ] Test network error detection
  - [ ] Test parse error detection
  - [ ] Test severity sorting in aggregation
  - [ ] Test partial success (some products fail, others succeed)
- [ ] Browser testing: verify error messages and retry buttons
- [ ] Verify discriminated union types work in IDE
- [ ] Test in browser: load home page and verify error handling with network inspector
- [ ] Verify critical CSS extraction includes ErrorPage styles

---

## Error Message Examples

### Network Error

```
type: "NETWORK_ERROR"
message: "Failed to fetch categories. Please check your connection and try again."
retriable: true
```

### Parse Error

```
type: "PARSE_ERROR"
message: "Failed to process categories data. The server response was invalid."
retriable: false
```

### Unknown Error

```
type: "UNKNOWN_ERROR"
message: "An unexpected error occurred while fetching categories."
retriable: false
```

---

## Expected Outcomes

### For Clients (Loaders, Components)

- Receive complete error information per operation
- Know exactly what data is available vs unavailable
- Distinguish between transient (retriable) and permanent failures
- Access severity to prioritize error handling logic
- Use timestamp for error correlation in logs

### For Developers

- Centralized error logging for debugging
- Consistent error handling pattern across all services
- Foundation for future retry logic implementation
- Ready for external error tracking integration (Sentry, DataDog, etc.)

### For End Users

- Precise error messages explaining what failed and why
- Graceful degradation: partial data available when possible
- Clear indication of retriable vs permanent failures

---

## Future Enhancements

1. **Retry Logic** - Automatic retry for network errors with exponential backoff
2. **External Error Tracking** - Integration with Sentry/DataDog for production monitoring
3. **Error Metrics** - Track error rates, types, and sources
4. **Error Boundaries** - React error boundary integration for graceful UI error handling
5. **Error Recovery UI** - Display error states and recovery options to users
6. **Localization** - i18n support for error messages in different languages

---

## References

- [DOCUMENTATION.md](./DOCUMENTATION.md) - General project documentation
- [CRITICAL_CSS_IMPLEMENTATION.md](./CRITICAL_CSS_IMPLEMENTATION.md) - CSS system reference
- Branch: `dummyjson-error-handling`
