"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwOnSerpBusinessError = throwOnSerpBusinessError;
exports.normalizeSerpResponse = normalizeSerpResponse;
function throwOnSerpBusinessError(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return;
    }
    const record = payload;
    const code = record.code ?? record.error_code ?? record.status_code;
    if (typeof code === 'undefined' || code === 0 || code === '0') {
        return;
    }
    const numericCode = typeof code === 'number' ? code : Number(code);
    if (!Number.isNaN(numericCode) && numericCode >= 200 && numericCode < 300) {
        return;
    }
    const message = [record.message, record.error, record.msg, record.data]
        .find((value) => typeof value === 'string' && value.trim());
    throw new Error(String(message || `Talordata SERP business error: ${code}`));
}
function queryFromParams(params) {
    const queryKeys = ['q', 'text', 'url', 'product_id', 'patent_id', 'author_id', 'trend'];
    for (const key of queryKeys) {
        const value = params[key];
        if (value !== null && typeof value !== 'undefined' && value !== '') {
            return value;
        }
    }
    return undefined;
}
function normalizeSerpResponse(input) {
    throwOnSerpBusinessError(input.payload);
    const { raw, taskId } = unwrapSerpPayload(input.payload);
    const normalized = {
        engine: input.params.engine,
        query: queryFromParams(input.params),
        raw
    };
    if (taskId) {
        normalized.taskId = taskId;
    }
    return normalized;
}
function unwrapSerpPayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return { raw: payload };
    }
    const record = payload;
    const code = record.code;
    if (code !== 200 && code !== '200') {
        return { raw: payload };
    }
    const data = record.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { raw: data ?? payload };
    }
    const dataRecord = data;
    const taskId = typeof dataRecord.task_id === 'string'
        ? dataRecord.task_id
        : typeof record.task_id === 'string'
            ? record.task_id
            : undefined;
    return {
        raw: dataRecord.result ?? data,
        taskId
    };
}
