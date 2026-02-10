/**
 * Test logging utilities for descriptive output
 * Provides structured logging for test execution
 */

export const testLogger = {
  /**
   * Log the start of a test group
   */
  testGroup: (name: string) => {
    console.group(`\n📋 Testing: ${name}`);
  },

  /**
   * End a test group
   */
  endGroup: () => {
    console.groupEnd();
  },

  /**
   * Log a test setup step
   */
  setup: (description: string, details?: unknown) => {
    console.log(`✅ Setup: ${description}`);
    if (details) {
      console.log(`   Details:`, details);
    }
  },

  /**
   * Log a test assertion
   */
  assert: (condition: boolean, message: string) => {
    const emoji = condition ? "✓" : "✗";
    console.log(`${emoji} Assert: ${message}`);
    return condition;
  },

  /**
   * Log an error scenario being tested
   */
  errorScenario: (errorType: string, details?: unknown) => {
    console.log(`⚠️  Testing ${errorType} error scenario`);
    if (details) {
      console.log(`   Details:`, details);
    }
  },

  /**
   * Log the result of an operation
   */
  result: (label: string, value: unknown) => {
    console.log(`📊 ${label}:`, value);
  },

  /**
   * Log test completion
   */
  complete: (message: string) => {
    console.log(`✨ ${message}`);
  },
};

/**
 * Create a mock response with required properties
 * Reduces boilerplate in test setup
 */
export function createMockResponse(
  ok: boolean,
  status: number,
  data?: unknown,
  error?: Error
): unknown {
  if (error) {
    return Promise.reject(error);
  }

  return Promise.resolve({
    ok,
    status,
    url: "https://dummyjson.com/products/categories",
    json: async () => {
      if (!ok || !data) {
        throw new Error("Invalid response");
      }
      return data;
    },
  } as unknown as Response);
}
