"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBooleanLike = parseBooleanLike;
exports.encodeUuleLocation = encodeUuleLocation;
exports.buildGeneratedActionParams = buildGeneratedActionParams;
exports.buildWebSearchParams = buildWebSearchParams;
exports.buildImageSearchParams = buildImageSearchParams;
exports.buildNewsSearchParams = buildNewsSearchParams;
exports.buildRawRequestParams = buildRawRequestParams;
exports.parseParamsJson = parseParamsJson;
exports.normalizeParamsJsonInput = normalizeParamsJsonInput;
exports.toFormUrlEncoded = toFormUrlEncoded;
exports.buildSerpRequestOptions = buildSerpRequestOptions;
const GOOGLE_UULE_ENGINES = new Set([
    'google',
    'google_ai_mode',
    'google_images',
    'google_jobs',
    'google_local',
    'google_shopping',
    'google_videos',
    'google_web'
]);
const UULE_LENGTH_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function parseBooleanLike(value, defaultValue = false) {
    if (value === null || typeof value === 'undefined' || value === '')
        return defaultValue;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y', 'on'].includes(normalized))
            return true;
        if (['false', '0', 'no', 'n', 'off'].includes(normalized))
            return false;
    }
    return Boolean(value);
}
function encodeBase64Url(value) {
    return Buffer.from(value, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}
function encodeUuleLocation(location) {
    const normalized = String(location || '').trim();
    if (!normalized)
        return '';
    const length = Math.min(normalized.length, UULE_LENGTH_ALPHABET.length - 1);
    return `w+CAIQICI${UULE_LENGTH_ALPHABET[length]}${encodeBase64Url(normalized)}`;
}
function addGoogleUuleFromLocation(action, params) {
    if (!GOOGLE_UULE_ENGINES.has(action.engine))
        return;
    if (params.uule !== null && typeof params.uule !== 'undefined' && params.uule !== '')
        return;
    const location = String(params.location || '').trim();
    if (location) {
        params.uule = encodeUuleLocation(location);
    }
}
function isBlank(value) {
    return value === null || typeof value === 'undefined' || value === '';
}
function buildGeneratedActionParams(input) {
    const queryParameter = input.action.parameters.find((parameter) => parameter.key === input.action.queryField);
    if (!queryParameter) {
        throw new Error(`${input.action.queryField} is not configured for ${input.action.toolName}`);
    }
    const query = String(input.values[queryParameter.propertyName] || '').trim();
    if (!query) {
        throw new Error(`${input.action.queryField} is required`);
    }
    const params = {
        engine: input.action.engine,
        [input.action.queryField]: query
    };
    for (const parameter of input.action.parameters) {
        if (parameter.key === input.action.queryField)
            continue;
        const value = input.values[parameter.propertyName];
        if (isBlank(value))
            continue;
        params[parameter.key] = parameter.type === 'boolean'
            ? parseBooleanLike(value)
            : value;
    }
    const extra = parseParamsJson(normalizeParamsJsonInput(input.paramsJson));
    delete extra.engine;
    for (const [key, value] of Object.entries(extra)) {
        if (!isBlank(value)) {
            params[key] = value;
        }
    }
    if (typeof params.json === 'undefined') {
        params.json = 2;
    }
    addGoogleUuleFromLocation(input.action, params);
    params.engine = input.action.engine;
    return params;
}
function buildWebSearchParams(input) {
    if (input.engine === 'bing') {
        return {
            engine: input.engine,
            q: input.query,
            cc: input.country,
            setlang: input.language,
            count: input.limit,
            no_cache: input.noCache,
            json: 2
        };
    }
    if (input.engine === 'yandex') {
        return {
            engine: input.engine,
            text: input.query,
            lang: input.language,
            p: 0,
            no_cache: input.noCache,
            json: 2
        };
    }
    return {
        engine: input.engine,
        q: input.query,
        gl: input.country,
        hl: input.language,
        num: input.limit,
        no_cache: input.noCache,
        json: 2
    };
}
function buildImageSearchParams(input) {
    if (input.engine === 'bing_images') {
        return {
            engine: input.engine,
            q: input.query,
            cc: input.country,
            setlang: input.language,
            mkt: input.market,
            count: input.limit,
            no_cache: input.noCache,
            json: 2
        };
    }
    return {
        engine: input.engine,
        q: input.query,
        gl: input.country,
        hl: input.language,
        num: input.limit,
        no_cache: input.noCache,
        json: 2
    };
}
function buildNewsSearchParams(input) {
    if (input.engine === 'bing_news') {
        return {
            engine: input.engine,
            q: input.query,
            cc: input.country,
            setlang: input.language,
            count: input.limit,
            no_cache: input.noCache,
            json: 2
        };
    }
    return {
        engine: input.engine,
        q: input.query,
        gl: input.country,
        hl: input.language,
        num: input.limit,
        no_cache: input.noCache,
        json: 2
    };
}
function buildRawRequestParams(input) {
    const engine = input.engine.trim();
    if (!engine) {
        throw new Error('engine is required');
    }
    const query = input.query.trim();
    const extra = parseParamsJson(input.paramsJson);
    const params = {
        ...extra,
        engine,
        json: typeof extra.json === 'undefined' ? 2 : extra.json
    };
    if (query) {
        params.q = query;
    }
    return params;
}
function parseParamsJson(value) {
    const raw = String(value || '').trim();
    if (!raw)
        return {};
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (error) {
        throw new Error('paramsJson is invalid JSON');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('paramsJson must be a JSON object');
    }
    return parsed;
}
function normalizeParamsJsonInput(value) {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || '{}';
    }
    if (!value) {
        return '{}';
    }
    return JSON.stringify(value);
}
function toFormUrlEncoded(params) {
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === '' || value === null || typeof value === 'undefined')
            continue;
        form.append(key, typeof value === 'boolean' ? String(value) : String(value));
    }
    return form.toString();
}
function buildSerpRequestOptions(input) {
    return {
        method: 'POST',
        url: input.endpoint,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Origin: 'n8n'
        },
        body: toFormUrlEncoded(input.params),
        json: true,
        timeout: 60000
    };
}
