import { makeUrl } from '../utils/helpers';

export const API = makeUrl('https://api.octopus.energy/v1/');
export const API_GRAPHQL = makeUrl(`${API}graphql/`);
export const API_PRODUCTS = makeUrl(`${API}products`);
export const API_ACCOUNTS = makeUrl(`${API}accounts`);
export const API_MJML = makeUrl('https://api.mjml.io/v1/render');
