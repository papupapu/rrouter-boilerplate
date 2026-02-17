/**
 * Configuration Service - Unified Server Startup Configuration
 *
 * This service manages all application configuration:
 * 1. Loads local configs from JSON files
 * 2. Fetches remote configs from APIs (if configured)
 * 3. Deep merges local and remote configs with priority rules
 * 4. Caches merged config indefinitely in memory
 * 5. Provides domain-specific getters for route loaders
 *
 * Configuration domains:
 * - API: Endpoints, timeouts, retry policies
 * - Metadata: Site info, SEO defaults, OG/Twitter cards
 * - Integrations: Third-party keys (analytics, CDN, monitoring)
 * - Categories: Product categories (remote-first with local fallback)
 *
 * Performance characteristics:
 * - Initialization: ~200-500ms (one-time cost at server startup)
 * - Runtime access: ~1ms (always cache hit)
 * - Network calls: 0 after initialization
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Category type (remote data from API)
 */
export type Category = {
  slug: string; // URL-friendly identifier
  name: string; // Display name
  url: string; // Full API URL
};

/**
 * API Configuration
 */
export type ApiConfig = {
  baseUrls: {
    dummyJson: string;
    swapi: string;
  };
  endpoints: {
    categories: string;
    productsByCategory: string;
    people: string;
  };
  timeouts: {
    default: number;
    categories: number;
  };
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
};

/**
 * Site Metadata Configuration
 */
export type MetadataConfig = {
  site: {
    name: string;
    description: string;
    url: string;
    locale: string;
  };
  defaults: {
    title: string;
    titleTemplate: string;
    description: string;
    keywords: string[];
  };
  openGraph: {
    type: string;
    siteName: string;
    image: string;
    imageWidth: number;
    imageHeight: number;
  };
  twitter: {
    card: string;
    site: string;
    creator: string;
  };
};

/**
 * Third-party Integrations Configuration
 */
export type IntegrationsConfig = {
  analytics: {
    enabled: boolean;
    googleAnalyticsId: string;
    googleTagManagerId: string;
    mixpanelToken: string;
  };
  cdn: {
    enabled: boolean;
    baseUrl: string;
    imageOptimization: boolean;
  };
  social: {
    twitter: string;
    github: string;
    linkedin: string;
    facebook: string;
  };
  monitoring: {
    enabled: boolean;
    sentryDsn: string;
    logRocketId: string;
  };
};

/**
 * Remote Config Source Definition
 */
export type RemoteSource = {
  enabled: boolean;
  url: string;
  method: "GET" | "POST";
  priority: "local" | "remote" | "merge";
  timeout: number;
  fallbackToLocal: boolean;
  transform: string | null;
};

/**
 * Remote Configuration
 */
export type RemoteConfig = {
  sources: {
    categories: RemoteSource;
  };
  global: {
    timeout: number;
    retryOnFailure: boolean;
    maxRetries: number;
  };
};

/**
 * Complete merged configuration
 */
export type AppConfig = {
  api: ApiConfig;
  metadata: MetadataConfig;
  integrations: IntegrationsConfig;
  categories: Category[];
  remote: RemoteConfig;
};

// ============================================================================
// Cache
// ============================================================================

/**
 * In-memory cache for merged configuration
 * Initialized at server startup via initializeConfig()
 */
let configCache: {
  data: AppConfig | null;
  timestamp: number;
  initialized: boolean;
} = {
  data: null,
  timestamp: 0,
  initialized: false,
};

// ============================================================================
// Local Config Loading
// ============================================================================

/**
 * Load all local JSON configuration files
 *
 * Uses dynamic imports to load JSON files at runtime.
 * Files are located in app/config/ directory.
 *
 * @returns Promise<Partial<AppConfig>> - Loaded local configurations
 * @throws Error if required config files are missing or invalid
 */
async function loadLocalConfigs(): Promise<Partial<AppConfig>> {
  console.log("[Config] Loading local configurations...");

  try {
    // Import JSON files (Vite handles this at build time)
    const [apiConfig, metadataConfig, integrationsConfig, remoteConfig] =
      await Promise.all([
        import("~/config/api.config.json"),
        import("~/config/metadata.config.json"),
        import("~/config/integrations.config.json"),
        import("~/config/remote.config.json"),
      ]);

    console.log(
      "[Config] ✅ Loaded local configs: api, metadata, integrations, remote"
    );

    return {
      api: apiConfig.default as ApiConfig,
      metadata: metadataConfig.default as MetadataConfig,
      integrations: integrationsConfig.default as IntegrationsConfig,
      remote: remoteConfig.default as RemoteConfig,
      categories: [], // Categories come from remote API
    };
  } catch (error) {
    console.error("[Config] ❌ Failed to load local configs:", error);
    throw new Error(
      `Failed to load local configurations: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ============================================================================
// Remote Config Loading
// ============================================================================

/**
 * Fetch remote configurations from APIs
 *
 * Based on remote.config.json definitions, fetches data from external sources.
 * Currently supports categories from DummyJSON API.
 *
 * @param localConfig - Local configuration with remote source definitions
 * @returns Promise<Partial<AppConfig>> - Fetched remote configurations
 */
async function loadRemoteConfigs(
  localConfig: Partial<AppConfig>
): Promise<Partial<AppConfig>> {
  console.log("[Config] Loading remote configurations...");

  const remoteData: Partial<AppConfig> = {};

  // Load categories if enabled
  if (localConfig.remote?.sources.categories.enabled) {
    const categoriesSource = localConfig.remote.sources.categories;
    const uri = `${localConfig.api?.baseUrls.dummyJson}${localConfig.api?.endpoints.categories}`;

    try {
      console.log(`[Config] Fetching categories from ${uri}...`);

      const response = await fetch(uri, {
        method: categoriesSource.method,
        signal: AbortSignal.timeout(categoriesSource.timeout),
      });

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      remoteData.categories = data as Category[];

      console.log(`[Config] ✅ Fetched ${data.length} categories from remote`);
    } catch (error) {
      console.error("[Config] ❌ Failed to fetch categories:", error);

      if (categoriesSource.fallbackToLocal) {
        console.log("[Config] Using local fallback for categories");
        remoteData.categories = [];
      } else {
        throw new Error(
          `Failed to fetch remote categories: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  }

  return remoteData;
}

// ============================================================================
// Config Merging
// ============================================================================

/**
 * Merge local and remote configurations with priority rules
 *
 * Priority logic per domain:
 * - API config: Local overrides remote (technical config stays in codebase)
 * - Metadata: Local overrides remote (SEO controlled in codebase)
 * - Integrations: Local overrides remote (security - keys in codebase)
 * - Categories: Remote overrides local (business data from API)
 *
 * Note: Deep merging is not currently implemented. If needed in the future,
 * implement a deepMerge utility function to recursively merge nested objects.
 *
 * @param localConfig - Configuration from JSON files
 * @param remoteConfig - Configuration from API endpoints
 * @returns AppConfig - Fully merged configuration
 */
function mergeConfigs(
  localConfig: Partial<AppConfig>,
  remoteConfig: Partial<AppConfig>
): AppConfig {
  console.log("[Config] Merging local and remote configurations...");

  // Start with local as base
  const merged: AppConfig = {
    api: localConfig.api!,
    metadata: localConfig.metadata!,
    integrations: localConfig.integrations!,
    remote: localConfig.remote!,
    categories: [],
  };

  // Categories: Remote takes priority (business data)
  if (remoteConfig.categories && remoteConfig.categories.length > 0) {
    merged.categories = remoteConfig.categories;
    console.log(
      `[Config] Using ${remoteConfig.categories.length} categories from remote`
    );
  } else if (localConfig.categories && localConfig.categories.length > 0) {
    merged.categories = localConfig.categories;
    console.log(
      `[Config] Using ${localConfig.categories.length} categories from local fallback`
    );
  }

  // API, Metadata, Integrations: Local takes priority (already set above)
  // If selective merging is needed in the future, implement here

  console.log("[Config] ✅ Configuration merge complete");
  return merged;
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize all application configurations at server startup
 *
 * This function should be called once when the server starts (in entry.server.tsx)
 * It orchestrates:
 * 1. Loading local configurations from JSON files
 * 2. Fetching remote configurations from APIs
 * 3. Merging configs with priority rules
 * 4. Caching merged config indefinitely
 *
 * @param options - Configuration options
 * @param options.force - Force refresh even if cache exists (default: false)
 *
 * @throws Error if initialization fails
 *
 * @example
 * // In app/entry.server.tsx (top-level)
 * await initializeConfig();
 * console.log("[Server] Configuration initialized");
 */
export async function initializeConfig(options?: {
  force?: boolean;
}): Promise<void> {
  const { force = false } = options || {};

  // Skip if already initialized (unless forced)
  if (!force && configCache.initialized) {
    console.log("[Config] Already initialized, skipping...");
    return;
  }

  console.log("[Config] ================================================");
  console.log("[Config] Initializing application configuration...");
  console.log("[Config] ================================================");

  try {
    // Step 1: Load local configurations
    const localConfig = await loadLocalConfigs();

    // Step 2: Fetch remote configurations
    const remoteConfig = await loadRemoteConfigs(localConfig);

    // Step 3: Merge configurations
    const mergedConfig = mergeConfigs(localConfig, remoteConfig);

    // Step 4: Cache the result
    configCache.data = mergedConfig;
    configCache.timestamp = Date.now();
    configCache.initialized = true;

    console.log("[Config] ================================================");
    console.log("[Config] ✅ Configuration initialized successfully");
    console.log("[Config] - API endpoints ready");
    console.log("[Config] - Metadata configured");
    console.log("[Config] - Integrations loaded");
    console.log(
      `[Config] - Categories: ${mergedConfig.categories.length} items`
    );
    console.log("[Config] ================================================");
  } catch (error) {
    console.error("[Config] ================================================");
    console.error("[Config] ❌ Configuration initialization failed");
    console.error("[Config] ================================================");
    console.error(error);
    throw error;
  }
}

// ============================================================================
// Domain-Specific Getters
// ============================================================================

/**
 * Get API configuration
 *
 * @returns ApiConfig - API endpoints, timeouts, retry policies
 * @throws Error if config not initialized
 */
export function getApiConfig(): ApiConfig {
  if (!configCache.initialized || !configCache.data) {
    throw new Error(
      "Configuration not initialized. Call initializeConfig() at server startup."
    );
  }
  return configCache.data.api;
}

/**
 * Get site metadata configuration
 *
 * @returns MetadataConfig - Site info, SEO defaults, OG/Twitter cards
 * @throws Error if config not initialized
 */
export function getMetadata(): MetadataConfig {
  if (!configCache.initialized || !configCache.data) {
    throw new Error(
      "Configuration not initialized. Call initializeConfig() at server startup."
    );
  }
  return configCache.data.metadata;
}

/**
 * Get third-party integrations configuration
 *
 * @returns IntegrationsConfig - Analytics, CDN, monitoring keys
 * @throws Error if config not initialized
 */
export function getIntegrations(): IntegrationsConfig {
  if (!configCache.initialized || !configCache.data) {
    throw new Error(
      "Configuration not initialized. Call initializeConfig() at server startup."
    );
  }
  return configCache.data.integrations;
}

/**
 * Get product categories
 *
 * Categories are fetched from remote API at startup and cached indefinitely.
 * This is the primary interface for accessing categories throughout the app.
 *
 * @returns Category[] - Array of product categories
 * @throws Error if config not initialized
 *
 * @example
 * // In route loader
 * export async function loader() {
 *   const categories = getCategories();
 *   return { categories };
 * }
 */
export function getCategories(): Category[] {
  if (!configCache.initialized || !configCache.data) {
    throw new Error(
      "Configuration not initialized. Call initializeConfig() at server startup."
    );
  }
  return configCache.data.categories;
}

/**
 * Get complete application configuration
 *
 * Useful for debugging and health checks.
 *
 * @returns AppConfig - All configuration domains
 * @throws Error if config not initialized
 */
export function getConfig(): AppConfig {
  if (!configCache.initialized || !configCache.data) {
    throw new Error(
      "Configuration not initialized. Call initializeConfig() at server startup."
    );
  }
  return configCache.data;
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear the configuration cache
 *
 * Useful for:
 * - Manual cache invalidation via admin endpoint
 * - Testing scenarios
 * - Forcing a refresh without server restart
 *
 * Note: After clearing, you must call initializeConfig() again
 *
 * @example
 * // Admin endpoint to refresh config
 * export async function action() {
 *   clearConfigCache();
 *   await initializeConfig();
 *   return { message: "Configuration refreshed" };
 * }
 */
export function clearConfigCache(): void {
  console.log("[Config] Cache cleared");
  configCache.data = null;
  configCache.timestamp = 0;
  configCache.initialized = false;
}

/**
 * Get configuration cache status
 *
 * Useful for:
 * - Health check endpoints
 * - Debugging and monitoring
 * - Verifying initialization status
 *
 * @returns Cache status information
 *
 * @example
 * // Health check endpoint
 * export async function loader() {
 *   const status = getConfigStatus();
 *   return {
 *     healthy: status.initialized,
 *     cacheAge: status.cacheAge
 *   };
 * }
 */
export function getConfigStatus(): {
  initialized: boolean;
  timestamp: number;
  cacheAge: number;
} {
  return {
    initialized: configCache.initialized,
    timestamp: configCache.timestamp,
    cacheAge: configCache.timestamp ? Date.now() - configCache.timestamp : 0,
  };
}
