import { z } from 'zod';
import { urlSchema } from '../../utils/schema';

export const schemaAllProducts = z.object({
  results: z.array(
    z.object({
      display_name: z.string(),
      direction: z.enum(['IMPORT', 'EXPORT']),
      brand: z.string(),
      code: z.string(),
      links: z.array(
        z.object({
          href: urlSchema,
          rel: z.enum(['self']),
        }),
      ),
    }),
  ),
});

export type AllProducts = z.infer<typeof schemaAllProducts>['results'];
