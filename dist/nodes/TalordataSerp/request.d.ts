import type { GeneratedSerpAction } from './generated/serp-actions';
export type SerpParams = Record<string, string | number | boolean | undefined | null>;
export interface SerpRequestOptionsInput {
    endpoint: string;
    params: SerpParams;
}
export interface WebSearchInput {
    query: string;
    engine: 'google' | 'google_web' | 'bing' | 'duckduckgo' | 'yandex';
    country: string;
    language: string;
    limit: number;
    noCache: boolean;
}
export interface ImageSearchInput {
    query: string;
    engine: 'bing_images' | 'google_images';
    country: string;
    language: string;
    market: string;
    limit: number;
    noCache: boolean;
}
export interface NewsSearchInput {
    query: string;
    engine: 'google_news' | 'bing_news';
    country: string;
    language: string;
    limit: number;
    noCache: boolean;
}
export interface RawRequestInput {
    engine: string;
    query: string;
    paramsJson: string;
}
export type ParamsJsonInput = string | Record<string, unknown> | undefined | null;
export interface GeneratedActionRequestInput {
    action: GeneratedSerpAction;
    values: Record<string, unknown>;
    paramsJson: ParamsJsonInput;
}
export declare function parseBooleanLike(value: unknown, defaultValue?: boolean): boolean;
export declare function encodeUuleLocation(location: string): string;
export declare function buildGeneratedActionParams(input: GeneratedActionRequestInput): SerpParams;
export declare function buildWebSearchParams(input: WebSearchInput): SerpParams;
export declare function buildImageSearchParams(input: ImageSearchInput): SerpParams;
export declare function buildNewsSearchParams(input: NewsSearchInput): SerpParams;
export declare function buildRawRequestParams(input: RawRequestInput): SerpParams;
export declare function parseParamsJson(value: string): SerpParams;
export declare function normalizeParamsJsonInput(value: ParamsJsonInput): string;
export declare function toFormUrlEncoded(params: SerpParams): string;
export declare function buildSerpRequestOptions(input: SerpRequestOptionsInput): {
    method: "POST";
    url: string;
    headers: {
        Accept: string;
        'Content-Type': string;
        Origin: string;
    };
    body: string;
    json: boolean;
    timeout: number;
};
