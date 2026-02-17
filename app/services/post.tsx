/**
 * Post Service - People API
 *
 * Fetches people data from API.
 * API endpoint is configured in app/config/api.config.json
 */

import { getApiConfig } from "./config";

export async function getDataBySlug(slug: string) {
  // Get API endpoint from config
  const apiConfig = getApiConfig();
  const url = apiConfig.endpoints.people.replace("{slug}", slug);

  const response = await fetch(url);
  const data = await response.json();
  return data;
}
