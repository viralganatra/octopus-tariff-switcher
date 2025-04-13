import type { AllProducts } from './schema';

let allProducts: AllProducts = [];

export function getCachedProducts() {
  return allProducts;
}

export function setCachedProducts(products: AllProducts) {
  allProducts = products;
}
