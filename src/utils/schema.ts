import { z } from 'zod';
import { Url } from '../types/misc';

export const urlSchema = z
  .string()
  .url()
  .transform((val) => val as Url);
