# Error Handling Strategy - Services Layer

> Strategia comprehensiva per la cattura, categorizzazione e propagazione di errori nel layer services con SSR

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Error Categories](#error-categories)
- [Implementation Layers](#implementation-layers)
- [Response Contract](#response-contract)
- [Usage Patterns](#usage-patterns)
- [Best Practices](#best-practices)
- [Testing Strategy](#testing-strategy)

## Overview

Questo documento descrive il sistema di error handling per il layer `app/services/`. Il goal è:

1. **Catturare** errori da tre fonti principali:
   - Errori di rete (Network timeouts, DNS failures, connection refused)
   - Errori HTTP (4xx, 5xx status codes)
   - Errori di parsing/validazione (dati malformati o non conformi a schema)

2. **Categorizzare** ogni errore con:
   - Tipo di errore (NetworkError, HttpError, ParseError, ValidationError)
   - HTTP status code (se applicabile)
   - Messaggio leggibile per il debug

3. **Propagare** gli errori verso il client in modo strutturato:
   - Errori specifici dal livello API sono catalogati e raccolti
   - Il client riceve dati parziali + lista di errori verificati
   - Ogni errore contiene abbastanza informazione per logiche di retry intelligenti

## Architecture

### Livelli di Error Handling

```
┌─────────────────────────────────────────┐
│   Client Layer (Routes/Components)      │
│   ↑ Riceve: ServiceResponse<T>          │
│   ├─ data: dati disponibili             │
│   ├─ errors: AppError[] categorizzati   │
│   └─ partialDataInfo: cosa è fallito    │
└──────────────▲────────────────────────┘
               │
┌──────────────┴────────────────────────┐
│   Service Layer (home.tsx, post.tsx)   │
│   ↑ Orchestration + Graceful Degradation
│   ├─ Chiama utility functions          │
│   ├─ Raccoglie errori (non filtrarli)  │
│   └─ Ritorna dati parziali + errori    │
└──────────────▲───────────────────────┘
               │
┌──────────────┴──────────────────────┐
│   Utility Layer (utilities/*)        │
│   ↑ Single responsibility            │
│   ├─ Validazione HTTP status         │
│   ├─ Parsing JSON                    │
│   ├─ Validazione con Zod schema      │
│   └─ Generazione AppError            │
└──────────────▲──────────────────────┘
               │
┌──────────────┴─────────────────────┐
│   API/Network Layer (fetch)         │
│   ↑ Raw HTTP calls + Network errors │
└─────────────────────────────────────┘
```

### Flow per Get Categories (Esempio)

```
fetch('https://dummyjson.com/products/categories')
         ↓
    [Network Error?] ──YES──→ Catch NetworkError
         │ NO
         ↓
    response.ok? ──NO──→ HttpError(statusCode, "Categorie non disponibili")
         │ YES
         ↓
    response.json()
         ↓
    [Parse Error?] ──YES──→ Catch ParseError
         │ NO
         ↓
    Valida con Zod schema
         ↓
    [Validation Error?] ──YES──→ ValidationError("Array di stringhe atteso")
         │ NO
         ↓
    ✅ Ritorna { data: [...], error: false }
```

### Flow per Get Products By Category (Esempio)

```
Simile a getCategories, MA:
- Cattura errori senza lanciare exception
- Ritorna sempre { error: boolean, data?, errorMessage?, errorCode?, errorStatusCode? }
- Se fallisce: home.tsx lo registra ma continua con altre categorie
```

### Flow per Home Service (Orchestration)

```
Inizia loop sulla lista di categorie
├─ Per ogni categoria:
│  ├─ Chiama getProductsByCategory(slug)
│  │  ├─ Se success: aggiungi ai results
│  │  └─ Se fallito: raccogli errore
│  └─ Continua con prossima categoria (no early return)
│
└─ Al termine:
   ├─ Se tutti gli errori = 0: ritorna { success: true, data: {...} }
   ├─ Se errori presenti: ritorna {
   │                         success: false,
   │                         data: { categories, topCategoriesProducts, categoriesProducts },
   │                         errors: [AppError, AppError, ...],
   │                         partialDataInfo: {
   │                           failedCategories: ["cat1", "cat2"],
   │                           attemptedCategories: 10
   │                         }
   │                       }
   └─ Se getCategories() fallisce: ritorna { success: false, data: null, errors: [AppError] }
```

## Error Categories

### 1. NetworkError

**Quando**: Errori di connessione, timeout, DNS resolution failure

**Cause comuni**:

- No internet connection
- Server unreachable (ECONNREFUSED, ENOTFOUND)
- Request timeout (AbortController timeout)
- Network interrupt

**Caratteristiche**:

- `code`: "NETWORK_ERROR"
- `statusCode`: null (non c'è HTTP response)
- `category`: "network"
- `retryable`: true (il client può tentare di nuovo)

**Esempio**:

```json
{
  "code": "NETWORK_ERROR",
  "message": "Failed to fetch categories: network request failed",
  "category": "network",
  "originalError": "TypeError: fetch failed"
}
```

### 2. HttpError

**Quando**: Response HTTP con status code 4xx o 5xx

**Cause comuni**:

- 404 - Endpoint non trovato o categoria non esiste
- 500 - Server error
- 503 - Service unavailable
- 429 - Rate limited

**Caratteristiche**:

- `code`: "HTTP_ERROR"
- `statusCode`: number (404, 500, etc.)
- `category`: "http"
- `retryable`: dipende dallo status (5xx = true, 4xx = false)

**Esempio**:

```json
{
  "code": "HTTP_ERROR",
  "statusCode": 404,
  "message": "Category not found: electronics",
  "category": "http",
  "urlAttempted": "https://dummyjson.com/products/category/electronics"
}
```

### 3. ParseError

**Quando**: Response JSON non è parseable

**Cause comuni**:

- Response non è JSON valido (HTML error page, etc.)
- Charset issues
- Corrupted response body

**Caratteristiche**:

- `code`: "PARSE_ERROR"
- `statusCode`: null
- `category`: "parse"
- `retryable`: false (il parsing fallisce sempre, non riprova)

**Esempio**:

```json
{
  "code": "PARSE_ERROR",
  "message": "Failed to parse API response as JSON",
  "category": "parse",
  "originalError": "SyntaxError: Unexpected token < in JSON at position 0"
}
```

### 4. ValidationError

**Quando**: Response JSON è valid ma non conforme allo schema atteso

**Cause comuni**:

- API ha cambiato format (breaking change)
- Campi obbligatori mancanti
- Tipo di campo non corrisponde (string invece di number)
- Risposta non è un array quando ci si aspetta un array

**Caratteristiche**:

- `code`: "VALIDATION_ERROR"
- `statusCode`: null
- `category`: "validation"
- `retryable`: false (il formato non cambierà)
- `details`: Zod parsing error details

**Esempio**:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Response data does not match expected schema",
  "category": "validation",
  "details": {
    "issues": [
      {
        "code": "invalid_type",
        "expected": "array",
        "received": "object",
        "path": ["products"],
        "message": "Expected array, received object"
      }
    ]
  }
}
```

## Implementation Layers

### Layer 1: Error Type Definitions (`app/services/types/errors.ts`)

```typescript
// Enum delle categorie di errore
export enum ErrorCategory {
  NETWORK = "network",
  HTTP = "http",
  PARSE = "parse",
  VALIDATION = "validation",
}

// Error codes per debugging specifico
export enum ErrorCode {
  // Network
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",

  // HTTP
  HTTP_ERROR = "HTTP_ERROR",
  NOT_FOUND = "NOT_FOUND",
  SERVER_ERROR = "SERVER_ERROR",

  // Parse
  PARSE_ERROR = "PARSE_ERROR",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

// AppError class - usato in tutta l'app
export class AppError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  statusCode?: number;
  details?: Record<string, any>;
  retryable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    category: ErrorCategory,
    options?: {
      statusCode?: number;
      details?: Record<string, any>;
      retryable?: boolean;
    }
  ) {
    super(message);
    this.code = code;
    this.category = category;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    this.retryable = options?.retryable ?? false;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      statusCode: this.statusCode,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

// Factory functions per creazione errori standardizzati
export const ErrorFactory = {
  networkError: (originalError: Error, context?: string): AppError =>
    new AppError(
      ErrorCode.NETWORK_ERROR,
      `${context ? `${context}: ` : ""}network request failed`,
      ErrorCategory.NETWORK,
      { retryable: true }
    ),

  httpError: (statusCode: number, url: string, context?: string): AppError =>
    new AppError(
      ErrorCode.HTTP_ERROR,
      `${context ? `${context}: ` : ""}HTTP ${statusCode} from ${url}`,
      ErrorCategory.HTTP,
      {
        statusCode,
        retryable: statusCode >= 500, // Retry su 5xx, non su 4xx
      }
    ),

  parseError: (originalError: Error, context?: string): AppError =>
    new AppError(
      ErrorCode.PARSE_ERROR,
      `${context ? `${context}: ` : ""}Failed to parse response as JSON`,
      ErrorCategory.PARSE,
      { retryable: false }
    ),

  validationError: (details: any, context?: string): AppError =>
    new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${context ? `${context}: ` : ""}Response does not match expected schema`,
      ErrorCategory.VALIDATION,
      { details, retryable: false }
    ),
};
```

### Layer 2: Validation Schemas (`app/services/schemas/`)

```typescript
// categories.schema.ts
import { z } from "zod";

export const CategoriesSchema = z.array(z.string());
export type Categories = z.infer<typeof CategoriesSchema>;

// products.schema.ts
export const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  price: z.number(),
  discountPercentage: z.number().optional(),
  rating: z.number().optional(),
  stock: z.number(),
  category: z.string(),
  // ... altri campi
});
export type Product = z.infer<typeof ProductSchema>;

// products-response.schema.ts
export const ProductsResponseSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});
export type ProductsResponse = z.infer<typeof ProductsResponseSchema>;
```

### Layer 3: Utility Functions con Validation

```typescript
// getCategories.tsx - REFACTORED
import { CategoriesSchema } from "../schemas/categories.schema";
import { AppError, ErrorFactory } from "../types/errors";

export async function getCategories() {
  try {
    const response = await fetch("https://dummyjson.com/products/categories");

    // Validazione HTTP status
    if (!response.ok) {
      throw ErrorFactory.httpError(
        response.status,
        response.url,
        "Failed to fetch categories"
      );
    }

    // Parsing JSON
    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw ErrorFactory.parseError(e as Error, "Categories response");
    }

    // Validazione con Zod
    const parsed = CategoriesSchema.safeParse(data);
    if (!parsed.success) {
      throw ErrorFactory.validationError(
        parsed.error.issues,
        "Categories schema validation"
      );
    }

    return {
      error: false,
      data: parsed.data,
      errorMessage: null,
      errorCode: null,
      errorStatusCode: null,
    };
  } catch (e) {
    const appError =
      e instanceof AppError ? e : ErrorFactory.networkError(e as Error);

    return {
      error: true,
      data: null,
      errorMessage: appError.message,
      errorCode: appError.code,
      errorStatusCode: appError.statusCode ?? null,
    };
  }
}
```

### Layer 4: Service Layer (Orchestration)

```typescript
// home.tsx - REFACTORED
import type { AppError } from "./types/errors";
import type { ServiceResponse } from "./types/response";
import { getCategories } from "./utils/getCategories";
import { getProductsByCategory } from "./utils/getProductsByCategory";

export async function fetchHomeData(): Promise<
  ServiceResponse<{
    categories: string[];
    topCategoriesProducts: Record<string, any[]>;
    categoriesProducts: Record<string, any[]>;
  }>
> {
  // Step 1: Fetch categories
  const categoriesResult = await getCategories();

  if (categoriesResult.error) {
    // Se le categorie falliscono, tutta la home fallisce - non c'è nulla da mostrare
    return {
      success: false,
      data: null,
      errors: [
        {
          code: categoriesResult.errorCode,
          message: categoriesResult.errorMessage,
          statusCode: categoriesResult.errorStatusCode,
        },
      ],
    };
  }

  const categories = categoriesResult.data;

  // Step 2: Fetch products per categoria (graceful degradation)
  const topCategories = categories.slice(0, 3);
  const topCategoriesProducts: Record<string, any[]> = {};
  const categoriesProducts: Record<string, any[]> = {};

  const errors: AppError[] = [];
  let attemptedCategories = 0;
  const failedCategories: string[] = [];

  // Fetch top categories products
  for (const category of topCategories) {
    attemptedCategories++;
    const result = await getProductsByCategory(category);

    if (!result.error) {
      topCategoriesProducts[category] = result.data || [];
    } else {
      errors.push({
        code: result.errorCode,
        message: result.errorMessage,
        statusCode: result.errorStatusCode,
        category: category, // Info su quale categoria è fallita
      });
      failedCategories.push(category);
    }
  }

  // Fetch all categories products
  for (const category of categories) {
    attemptedCategories++;
    const result = await getProductsByCategory(category);

    if (!result.error) {
      categoriesProducts[category] = result.data || [];
    } else {
      if (!failedCategories.includes(category)) {
        errors.push({
          code: result.errorCode,
          message: result.errorMessage,
          statusCode: result.errorStatusCode,
          category: category,
        });
        failedCategories.push(category);
      }
    }
  }

  // Step 3: Construct response
  const success = errors.length === 0;

  return {
    success,
    data: {
      categories,
      topCategoriesProducts,
      categoriesProducts,
    },
    errors: success ? undefined : errors,
    partialDataInfo: success
      ? undefined
      : {
          failedCategories,
          attemptedCategories,
          successfulFetches: attemptedCategories - failedCategories.length,
        },
  };
}
```

## Response Contract

### ServiceResponse Interface

```typescript
// types/response.ts
export interface ServiceResponse<T> {
  // true se tutti i fetch sono succeedi senza errori
  success: boolean;

  // Dati disponibili - potrebbe essere parziale se success=false
  data?: T;

  // Array di errori categorizzati (presente solo se success=false)
  errors?: Array<{
    code: string;
    message: string;
    statusCode?: number;
    category?: string; // Per quale categoria è fallito
  }>;

  // Info su quale dati sono parziali (presente solo se success=false e data presente)
  partialDataInfo?: {
    failedCategories: string[];
    attemptedCategories: number;
    successfulFetches: number;
  };
}
```

### Esempi di Responses

**Successo Totale**:

```json
{
  "success": true,
  "data": {
    "categories": ["electronics", "clothing", "books"],
    "topCategoriesProducts": {
      "electronics": [...],
      "clothing": [...]
    },
    "categoriesProducts": {...}
  }
}
```

**Fallimento Totale (getCategories failed)**:

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "HTTP_ERROR",
      "message": "HTTP 503 from https://dummyjson.com/products/categories",
      "statusCode": 503
    }
  ]
}
```

**Fallimento Parziale (una categoria non disponibile)**:

```json
{
  "success": false,
  "data": {
    "categories": ["electronics", "clothing", "books"],
    "topCategoriesProducts": {
      "electronics": [...],
      "clothing": [...]
    },
    "categoriesProducts": {
      "electronics": [...],
      "clothing": [...]
    }
  },
  "errors": [
    {
      "code": "HTTP_ERROR",
      "message": "HTTP 404 from https://dummyjson.com/products/category/books",
      "statusCode": 404,
      "category": "books"
    }
  ],
  "partialDataInfo": {
    "failedCategories": ["books"],
    "attemptedCategories": 3,
    "successfulFetches": 2
  }
}
```

## Usage Patterns

### Pattern 1: Client Riceve Dati Completi o Errore Totale

```typescript
// app/routes/home.tsx - route loader

export const loader = async () => {
  const response = await fetchHomeData();

  if (!response.success && !response.data) {
    // Totale fallimento - non ci sono dati da mostrare
    return { isError: true, error: response.errors?.[0] };
  }

  // Successo completo o parziale - comunque abbiamo dati da mostrare
  return {
    isError: false,
    data: response.data,
    errors: response.errors,
    partialDataInfo: response.partialDataInfo,
  };
};
```

### Pattern 2: Component Reagisce a Fallimenti Parziali

```typescript
// app/views/home/home.tsx

export const Home = ({ loaderData }: { loaderData: any }) => {
  const { data, errors, partialDataInfo, isError } = loaderData;

  if (isError) {
    return <ErrorPage error={errors?.[0]} />;
  }

  return (
    <div>
      {partialDataInfo && (
        <ErrorBanner
          message={`Some categories failed to load (${partialDataInfo.failedCategories.join(", ")})`}
          failedCategories={partialDataInfo.failedCategories}
        />
      )}

      <CategoriesSection categories={data.categories} />
      <ProductsGrid products={data.topCategoriesProducts} />
    </div>
  );
};
```

### Pattern 3: Client Implementa Retry con Categorizzazione

```typescript
// Esempio futura logica client-side

const handleRetry = async (error: ServiceError) => {
  if (error.code === "HTTP_ERROR" && error.statusCode >= 500) {
    // Server error - retry ha senso
    await retryFetch(error.category);
  } else if (error.code === "VALIDATION_ERROR") {
    // Non riprova - il formato non cambierà
    showError("Data format mismatch, please contact support");
  } else if (error.code === "NETWORK_ERROR") {
    // Network error - spinner di caricamento + retry
    showWarning("Connection lost, retrying...");
    await retryWithBackoff();
  }
};
```

## Best Practices

### ✅ DO

1. **Catturare tutti gli errori** - Non lasciar passare exception non gestite

   ```typescript
   try {
     // ...
   } catch (e) {
     const appError = e instanceof AppError ? e : ErrorFactory.networkError(e);
     return { error: true, errorCode: appError.code };
   }
   ```

2. **Usare ErrorFactory** - Standardizza la creazione di errori

   ```typescript
   throw ErrorFactory.httpError(404, url, "Categories");
   ```

3. **Validare HTTP Status** - Non assumere 200 se status non è ok

   ```typescript
   if (!response.ok) {
     throw ErrorFactory.httpError(response.status, response.url);
   }
   ```

4. **Validare Risposta con Zod** - Cattura breaking changes dell'API

   ```typescript
   const parsed = CategoriesSchema.safeParse(data);
   if (!parsed.success) {
     throw ErrorFactory.validationError(parsed.error.issues);
   }
   ```

5. **Propagare Informazione di Context** - Aiuta il debug

   ```typescript
   catch (e) {
     throw ErrorFactory.parseError(e, "Categories response parsing");
     // ^^^ "Categories response parsing" è il context
   }
   ```

6. **Fare Graceful Degradation** - Non fallire tutto se una parte fallisce
   ```typescript
   for (const category of categories) {
     const result = await getProductsByCategory(category);
     if (result.error) {
       errors.push(result); // Raccogli, non lanciare
     } else {
       products[category] = result.data;
     }
   }
   ```

### ❌ DON'T

1. **Non ingoiare errori silenziosamente**

   ```typescript
   // ❌ BAD
   try {
     // ...
   } catch (e) {
     console.log("error"); // Non dice cosa è fallito
   }
   ```

2. **Non usare generic Error**

   ```typescript
   // ❌ BAD
   throw new Error("Something went wrong");

   // ✅ GOOD
   throw ErrorFactory.networkError(originalError, "Categories fetch");
   ```

3. **Non assumere response.ok**

   ```typescript
   // ❌ BAD
   const data = await response.json();

   // ✅ GOOD
   if (!response.ok)
     throw ErrorFactory.httpError(response.status, response.url);
   const data = await response.json();
   ```

4. **Non validare manualmente**

   ```typescript
   // ❌ BAD
   if (data.length > 0) { ... } // Fragile

   // ✅ GOOD
   const parsed = CategoriesSchema.safeParse(data);
   if (!parsed.success) throw ErrorFactory.validationError(parsed.error.issues);
   ```

5. **Non fare early return** nel service orchestrator se una risorsa fallisce

   ```typescript
   // ❌ BAD
   if (getProductsByCategory(cat1).error) {
     return { error: true }; // Abbandona altri fetch
   }

   // ✅ GOOD
   const result = await getProductsByCategory(cat1);
   if (result.error) {
     errors.push(result); // Continua col prossimo
   }
   ```

## Phase 5 Implementation Summary

### ✅ Completato: Test Output Modes (Minimal vs Verbose)

**Configurazione Dinamica del Reporter**

- ✅ Vitest configurato per selezionare il reporter dinamicamente basato su env var `VITEST_REPORTER_MODE`
- ✅ Modalità **minimal** (default): output compatto `"default"` reporter
- ✅ Modalità **verbose**: output dettagliato `["verbose", "html"]` + HTML report a `./test-results/index.html`
- ✅ Modalità **coverage**: coverage reporter per analisi di copertura

**New NPM Scripts**

```bash
yarn test              # Minimale (pre-commit, CI)
yarn test:verbose      # Verbosa + HTML report (sviluppo interattivo)
yarn test:ui           # UI dashboard (Vitest UI exploration)
yarn test:coverage     # Coverage report (analisi copertura)
```

**Dipendenze Aggiunte**

- ✅ `cross-env@7.0.3` per compatibilità cross-platform (Windows/Mac/Linux)

### ✅ Completato: Pre-commit Hook Integration

**Configurazione Husky + Test Validation**

- ✅ Pre-commit hook esegue `yarn test` (minimale) PRIMA del linting
- ✅ Commit bloccato se test falliscono (exit code 1) ❌
- ✅ Commit bloccato se linting fallisce (eslint + prettier) ❌
- ✅ Commit consentito solo se ENTRAMBI passano ✅

**Flusso Pre-commit**

```
User: git commit -m "..."
  ↓
1. Esegui: yarn test (minimale) [~1-2 secondi]
   ├─ Se fallisce → STOP, commit bloccato ❌
   ├─ Se passa → continua
   ↓
2. Esegui: npx lint-staged (eslint + prettier)
   ├─ Se fallisce → STOP, commit bloccato ❌
   └─ Se passa → commit permesso ✅
```

**Skip Hook (Emergenza)**

```bash
git commit --no-verify -m "emergency fix"  # Salta completamente
npm run prepare                             # Riabilita dopo il debug
```

### ✅ Completato: Documentazione Aggiornata

- ✅ Tabella comparativa modalità test (minimal, verbose, ui, coverage)
- ✅ Esempi di output per ogni modalità
- ✅ Istruzioni per visualizzare HTML report
- ✅ Flusso pre-commit diagrammato
- ✅ Comando per skippare hook in emergenze
- ✅ Roadmap aggiornato con Phase 5 completata

## Testing Strategy

### Test per Utility Functions

```typescript
// test: getCategories.test.ts
describe("getCategories", () => {
  it("ritorna dati su successo", async () => {
    // Mock fetch con successo
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(["electronics", "clothing"]),
      })
    );

    const result = await getCategories();
    expect(result.error).toBe(false);
    expect(result.data).toEqual(["electronics", "clothing"]);
  });

  it("cattura HTTP 404", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        url: "https://...",
      })
    );

    const result = await getCategories();
    expect(result.error).toBe(true);
    expect(result.errorCode).toBe("HTTP_ERROR");
    expect(result.errorStatusCode).toBe(404);
  });

  it("cattura network errors", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("Network failed")));

    const result = await getCategories();
    expect(result.error).toBe(true);
    expect(result.errorCode).toBe("NETWORK_ERROR");
  });

  it("cattura validation errors", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ notAnArray: true }),
      })
    );

    const result = await getCategories();
    expect(result.error).toBe(true);
    expect(result.errorCode).toBe("VALIDATION_ERROR");
  });
});
```

### Test per Service Layer

```typescript
// test: home.test.ts
describe("fetchHomeData", () => {
  it("ritorna successo completo", async () => {
    // Mock sia getCategories che getProductsByCategory
    // Aspettati: success=true, data != null, errors = undefined

    const result = await fetchHomeData();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("ritorna fallimento totale se getCategories fallisce", async () => {
    // Mock getCategories con errore
    // Aspettati: success=false, data=null, errors = [...]

    const result = await fetchHomeData();
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.errors).toBeDefined();
  });

  it("ritorna fallimento parziale se una categoria fallisce", async () => {
    // Mock getCategories con successo
    // Mock getProductsByCategory fallire per una categoria
    // Aspettati: success=false, data != null (parziale), errors = [...], partialDataInfo = {...}

    const result = await fetchHomeData();
    expect(result.success).toBe(false);
    expect(result.data).toBeDefined();
    expect(result.errors).toHaveLength(1);
    expect(result.partialDataInfo?.failedCategories).toContain("electronics");
  });
});
```

### Running Tests & Viewing Reports

#### Test Modes (Minimal vs Verbose)

| Mode         | Command              | Output                              | Use Case                                 |
| ------------ | -------------------- | ----------------------------------- | ---------------------------------------- |
| **Minimal**  | `yarn test`          | Compact summary (pass/fail count)   | Pre-commit hook, CI/CD, quick validation |
| **Verbose**  | `yarn test:verbose`  | Detailed output + HTML report       | Interactive development, debugging       |
| **UI**       | `yarn test:ui`       | Interactive dashboard (Vitest UI)   | Visual test exploration                  |
| **Coverage** | `yarn test:coverage` | Coverage reports (text, json, html) | Code coverage analysis                   |

#### Minimal Mode (Default for Pre-commit)

```bash
# Esegui test con output minimale (blocca commit se fallisce)
yarn test

# Output atteso:
# ✓ getCategories.test.ts (12)
# ✓ getProductsByCategory.test.ts (16)
# ✓ home.test.ts (10)
# Test Files  3 passed (3)
# Tests  38 passed (38)
```

#### Verbose Mode (Full Details + HTML Report)

```bash
# Esegui test con output verboso e genera HTML report
yarn test:verbose

# Output atteso:
# 🧪 getCategories
#   ✅ returns data on success
#   ❌ captures HTTP 404
#   🌐 captures network errors
#   ...
# 📊 Report generated: ./test-results/index.html
```

#### HTML Report Viewer

I test in modalità verbose generano un file HTML con il report completo di ogni test.

**Come visualizzare il report:**

Dopo aver eseguito `yarn test:verbose`, il report HTML viene salvato in `./test-results/index.html`.

**Opzione 1: Aprire il file direttamente (macOS)**

```bash
open ./test-results/index.html
```

**Opzione 2: Aprire il file direttamente (Windows/Linux)**

```bash
# Windows
start test-results/index.html

# Linux
xdg-open ./test-results/index.html
```

**Opzione 3: Servire con un server locale**

```bash
# Usando http-server (npm)
npx http-server ./test-results

# oppure usando Python
python -m http.server -d test-results 8000
# Poi apri http://localhost:8000
```

**Nel report HTML potrai:**

- ✅ Visualizzare lo stato di ogni test (pass/fail con check e X)
- 📊 Vedere la durata di esecuzione per test
- 📝 Leggere il log completo con tutti i `console.log` di ogni test
- 🔍 Filtrare per file di test o nome del test
- 🎯 Navigare tra i diversi test groups/describe blocks

**Watch Mode (Durante Sviluppo)**

```bash
# Esegui test in watch mode - riesamina al salvataggio dei file
yarn test --watch
# oppure
yarn test:verbose --watch
```

#### Pre-commit Hook Integration

Il progetto è configurato con **Husky** per eseguire i test automaticamente prima di ogni commit.

**Flusso Pre-commit:**

```
1. User esegue: git commit -m "..."
   ↓
2. Husky intercetta il pre-commit hook
   ↓
3. Esegue: yarn test (modalità minimale)
   ├─ Se test FALLISCONO → commit è BLOCCATO ❌
   └─ Se test PASSANO → continua
   ↓
4. Esegue: npx lint-staged (eslint + prettier)
   ├─ Se linting FALLISCE → commit è BLOCCATO ❌
   └─ Se linting PASSA → commit è permesso ✅
```

**Skip Pre-commit Hook (Emergenza)**

Se hai bisogno di bypassare il pre-commit hook in situazioni critiche:

```bash
# Salta completamente il pre-commit hook
git commit --no-verify -m "emergency fix"
```

⚠️ **Nota**: Usa `--no-verify` solo in casi eccezionali. Il hook esiste per prevenire broken commits nella repo.

**Disabilitare il Pre-commit Hook Temporaneamente**

Se vuoi disabilitare il pre-commit durante il debug:

```bash
# Disabilita l'hook temporaneamente
npx husky uninstall

# Riattivalo dopo il debug
npm run prepare
```

## Roadmap

- **Phase 1** (✅ COMPLETE): Definire tipi e factory, refactor utilities
  - ✅ Created error types and categories (ErrorCategory, ErrorCode, AppError)
  - ✅ Implemented ErrorFactory for standardized error creation
  - ✅ Created ServiceResponse<T> interface and response utilities
  - ✅ Refactored getCategories.tsx with HTTP validation + parse error handling
  - ✅ Refactored getProductsByCategory.tsx with structure/array validation
  - ✅ Refactored home.tsx with graceful degradation and partial data support
  - ✅ Fixed all TypeScript errors (no `any` types, strict mode compliant)

- **Phase 2** (✅ COMPLETE): Aggiungere Zod schema validation
  - ✅ Installed Zod v4.3.6 as dependency
  - ✅ Created categories schema (array of non-empty strings)
  - ✅ Created product schema with essential fields (id, title, price, etc.)
  - ✅ Created products-response schema (validates API response structure)
  - ✅ Integrated Zod validation into getCategories.tsx
  - ✅ Integrated Zod validation into getProductsByCategory.tsx
  - ✅ Created centralized schema index for easy imports
  - ✅ All validations use safeParse (no exceptions thrown, structured error responses)

- **Phase 3** (✅ COMPLETE): Implementare tests per tutte le failure cases
  - ✅ Setup Vitest v4.0.18 as test framework (optimized for Vite)
  - ✅ Created comprehensive test suite for getCategories.tsx (12 tests)
    - ✅ Success case: valid categories array
    - ✅ HTTP errors: 404, 500, 429 with correct error codes
    - ✅ Network errors: connection failures, timeouts
    - ✅ JSON parse errors: invalid JSON responses
    - ✅ Validation errors: non-array, wrong types, empty strings, null
  - ✅ Created comprehensive test suite for getProductsByCategory.tsx (16 tests)
    - ✅ Success cases: with/without metadata, minimal response
    - ✅ HTTP errors: 404, 500, 401 with correct classification
    - ✅ Network errors: DNS failures, fetch failures
    - ✅ JSON parse errors: malformed JSON
    - ✅ Validation errors: missing fields, wrong types, negative values, null
  - ✅ Created comprehensive test suite for home.tsx service (10 tests)
    - ✅ Complete success: all categories + products fetch
    - ✅ Complete failure: getCategories fails returns null data
    - ✅ Partial failure: some categories fail, tracks failedResources
    - ✅ Data organization: proper categorization, slicing (3 top, 1 remaining)
    - ✅ Edge cases: 1, 2, and many categories
  - ✅ All 38 tests passing (100% success rate)
  - ✅ Added npm scripts: `yarn test`, `yarn test:ui`, `yarn test:coverage`
  - ✅ Created vitest.config.ts with happy-dom environment

- **Phase 4** (✅ COMPLETE): Enhanced test output con feedback descrittivo
  - ✅ Configurato Vitest con verbose reporter
  - ✅ Aggiunto HTML reporter con dashboard interattivo
  - ✅ Migliorati title dei test con emoji e descrizioni complete
  - ✅ Aggiunto logging dettagliato in ogni test (setup, mocks, assertions, results)
  - ✅ getCategories.test.ts: 12 test con categorizzazione (✅, ❌, 🌐, 📄, ✔️)
  - ✅ getProductsByCategory.test.ts: 16 test con stessi pattern di logging
  - ✅ home.test.ts: 10 test per orchestrazione con graceful degradation tracking
  - ✅ Documentazione su come visualizzare il report HTML (`npx vite preview --outDir test-results`)
  - ✅ Tutti 38 test passano con output leggibile per debugging

- **Phase 5** (🚀 IN PROGRESS): Test output modes + Pre-commit validation
  - ✅ Installed `cross-env` v7.0.3 for cross-platform compatibility
  - ✅ Refactored vitest.config.ts with dynamic reporter selection
    - ✅ Minimal mode: compact "default" reporter (pre-commit/CI)
    - ✅ Verbose mode: "verbose" + "html" reporter (interactive development)
    - ✅ Coverage mode: coverage reporting
  - ✅ Updated npm scripts with environment variables
    - ✅ `yarn test`: minimal mode (VITEST_REPORTER_MODE=minimal)
    - ✅ `yarn test:verbose`: verbose mode (VITEST_REPORTER_MODE=verbose)
    - ✅ `yarn test:coverage`: coverage mode (VITEST_REPORTER_MODE=coverage)
  - ✅ Integrated test validation into Husky pre-commit hook
    - ✅ Tests run BEFORE linting (test-first approach)
    - ✅ Commit blocked if tests fail (exit code 1)
    - ✅ Support for `--no-verify` skip in emergencies
  - ✅ Updated documentation with test modes, pre-commit workflow, skip instructions

- **Phase 6**: SSR error pages con errori categorizzati

---

**Last Updated**: 10 Feb 2026
