/**
 * Post Service - Product API
 *
 * Fetches product data from API.
 * API endpoint is configured in app/config/api.config.json
 */

import { getApiConfig } from "./config";

export async function getProduct({ slug }: { slug: string }) {
  // Get API endpoint from config
  const apiConfig = getApiConfig();
  const {
    baseUrls: { dummyJson },
    endpoints: { product },
  } = apiConfig;

  const url = `${dummyJson}${product}`.replace("{slug}", slug);

  const response = await fetch(url);
  const data = await response.json();
  return data;
}
