import type { AllProducts } from './schema';

let token: string;
let allProducts: AllProducts = [];

export function getCachedToken() {
  return token;
}

export function setCachedToken(newToken: string) {
  token = newToken;
  return token;
}

export function getCachedProducts() {
  return allProducts;
}

export function setCachedProducts(products: AllProducts) {
  allProducts = products;
  return allProducts;
}
