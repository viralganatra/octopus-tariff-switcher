import { z } from 'zod';
import camelcaseKeys from 'camelcase-keys';
import type { CamelCasedPropertiesDeep } from 'type-fest';
import type { Url } from '../types/misc';

export const urlSchema = z.url().transform<Url>((val) => val as Url);

function camelcaseKeysExceptUnderscore<T>(input: T): T {
  // biome-ignore lint/suspicious/noExplicitAny: <camelcase-keys can't preserve type structure>
  return camelcaseKeys(input as any, {
    deep: true,
    exclude: [/^_/], // Skip transforming keys that start with _
  }) as T;
}

export const snakeToCamelSchema = <T extends z.ZodTypeAny>(zodSchema: T) =>
  zodSchema.transform(
    (val) => camelcaseKeysExceptUnderscore(val) as CamelCasedPropertiesDeep<z.infer<T>>,
  );
