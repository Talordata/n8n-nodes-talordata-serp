import type { SerpParams } from './request';
export interface NormalizeInput {
    params: SerpParams;
    payload: unknown;
}
export declare function throwOnSerpBusinessError(payload: unknown): void;
export declare function normalizeSerpResponse(input: NormalizeInput): Record<string, unknown>;
