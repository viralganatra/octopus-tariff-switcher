import 'vitest';
import type { CustomMatcher } from 'aws-sdk-client-mock-jest';

declare module 'vitest' {
  type Assertion<T = unknown> = CustomMatcher<T>;
  type AsymmetricMatchersContaining = CustomMatcher;
}
