import type { AllProducts } from './schema';

// Kraken tokens are valid for ~1 hour; refresh well before that so a
// warm Lambda container never reuses an expired token
const TOKEN_TTL_MS = 45 * 60 * 1000;

let cachedToken: { token: string; expiresAtMs: number } | undefined;
let allProducts: AllProducts = [];

export function getCachedToken(): string | undefined {
  if (!cachedToken || Date.now() >= cachedToken.expiresAtMs) {
    return undefined;
  }

  return cachedToken.token;
}

export function setCachedToken(newToken: string) {
  cachedToken = { token: newToken, expiresAtMs: Date.now() + TOKEN_TTL_MS };
  return newToken;
}

export function getCachedProducts() {
  return allProducts;
}

export function setCachedProducts(products: AllProducts) {
  allProducts = products;
  return allProducts;
}
