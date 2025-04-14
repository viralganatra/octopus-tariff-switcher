import { z } from 'zod';
import type { Url } from '../types/misc';

export const urlSchema = z
  .string()
  .url()
  .transform<Url>((val) => val as Url);
