# Fetch Error Handling Implementation Plan

> Precise, elegant error handling system for data-fetching utilities with granular error classification, severity-ordered aggregation, and rich error context.

**Status**: Planning Phase  
**Branch**: `dummyjson-error-handling`  
**Last Updated**: 29 Gennaio 2026

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

### What's NOT Included

- UI error handling/rendering (deferred)
- Error recovery/retry logic (future enhancement)
- i18n/localization for error messages (plain English)
- External error tracking service integration (foundation provided)

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

### Phase 1: Type Definitions & Utilities

**Files to create**:

1. **app/utils/errorTypes.ts**
   - ErrorType enum
   - ErrorSeverity enum
   - ErrorCode enum
   - FetchError interface
   - ErrorContext interface
   - Discriminated union type exports

2. **app/utils/logger.ts**
   - `logError(code, type, severity, message, retriable, context?)` function
   - Dev vs production logging
   - Returns `{timestamp: number}`

3. **app/utils/errorDetector.ts**
   - `detectErrorType(error: unknown): ErrorType` - Classify exceptions
   - `determineSeverity(operation: string): ErrorSeverity` - Based on operation
   - `isRetriable(type: ErrorType): boolean` - Network errors retriable
   - `generateMessage(type: ErrorType, operation: string): string` - User-friendly text

### Phase 2: Service Layer Refactoring

**Files to update**:

1. **app/services/utils/getCategories.tsx**
   - Import error utilities
   - Use error detector for classification
   - Return discriminated union response
   - Call logger on error with context

2. **app/services/utils/getProductsByCategory.tsx**
   - Import error utilities
   - Use error detector for classification
   - Return discriminated union response
   - Call logger with category context

3. **app/services/home.tsx**
   - Update to call new getCategories/getProductsByCategory signatures
   - Collect all errors in array
   - Sort errors by severity (CRITICAL first)
   - Return aggregated response with `errors[]`
   - Status logic: `"error"` if any errors exist

---

## Todo List

### Phase 1: Type System & Logging Infrastructure

- [ ] Create `app/utils/errorTypes.ts`
  - [ ] Define ErrorType enum
  - [ ] Define ErrorSeverity enum
  - [ ] Define ErrorCode enum
  - [ ] Define FetchError interface
  - [ ] Define ErrorContext interface
  - [ ] Export discriminated union types

- [ ] Create `app/utils/logger.ts`
  - [ ] Implement logError function with dev/prod awareness
  - [ ] Capture error context metadata
  - [ ] Return timestamp for FetchError

- [ ] Create `app/utils/errorDetector.ts`
  - [ ] Implement detectErrorType function (TypeError → network, SyntaxError → parse)
  - [ ] Implement determineSeverity function (categories → critical, products → warning)
  - [ ] Implement isRetriable function
  - [ ] Implement generateMessage function with user-friendly text

### Phase 2: Service Layer Refactoring

- [ ] Update `app/services/utils/getCategories.tsx`
  - [ ] Import error utilities
  - [ ] Refactor try/catch to use error detector
  - [ ] Return discriminated union response
  - [ ] Call logger with operation context

- [ ] Update `app/services/utils/getProductsByCategory.tsx`
  - [ ] Import error utilities
  - [ ] Refactor try/catch to use error detector
  - [ ] Return discriminated union response
  - [ ] Call logger with category context

- [ ] Refactor `app/services/home.tsx`
  - [ ] Update getCategories call to new signature
  - [ ] Update getProductsByCategory calls to new signature
  - [ ] Implement error collection in errors[] array
  - [ ] Sort errors by severity (CRITICAL before WARNING)
  - [ ] Return aggregated response with errors array
  - [ ] Implement status logic: "error" if any errors

### Phase 3: Testing & Verification

- [ ] TypeScript compilation check
- [ ] Manual testing: verify error detection works correctly
  - [ ] Test network error detection
  - [ ] Test parse error detection
  - [ ] Test severity sorting in aggregation
  - [ ] Test partial success (some products fail, others succeed)
- [ ] Review logger output in dev mode
- [ ] Verify discriminated union types work in IDE

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
