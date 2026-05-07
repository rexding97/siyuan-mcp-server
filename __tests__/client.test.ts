import { describe, expect, test } from '@jest/globals';
import { normalizeSiyuanApiUrl, resolveSiyuanToken } from '../src/utils/client.js';

describe('normalizeSiyuanApiUrl', () => {
    test('falls back to localhost when value is empty', () => {
        expect(normalizeSiyuanApiUrl(undefined)).toBe('http://localhost:6806');
        expect(normalizeSiyuanApiUrl('   ')).toBe('http://localhost:6806');
    });

    test('adds http scheme when SIYUAN_API_URL has no scheme', () => {
        expect(normalizeSiyuanApiUrl('100.66.1.1:6806')).toBe('http://100.66.1.1:6806');
    });

    test('keeps existing http/https scheme', () => {
        expect(normalizeSiyuanApiUrl('http://localhost:6806')).toBe('http://localhost:6806');
        expect(normalizeSiyuanApiUrl('https://example.com:6806')).toBe('https://example.com:6806');
    });
});

describe('resolveSiyuanToken', () => {
    test('prefers SIYUAN_TOKEN over fallback names', () => {
        expect(resolveSiyuanToken({
            SIYUAN_TOKEN: 'preferred',
            SIYUAN_API_TOKEN: 'fallback1',
            SIYUAN_AUTH_TOKEN: 'fallback2'
        } as Record<string, string | undefined>)).toBe('preferred');
    });

    test('supports SIYUAN_API_TOKEN fallback used by user env', () => {
        expect(resolveSiyuanToken({
            SIYUAN_API_TOKEN: 'api-token-value'
        } as Record<string, string | undefined>)).toBe('api-token-value');
    });

    test('returns empty string when all env vars are missing', () => {
        expect(resolveSiyuanToken({} as Record<string, string | undefined>)).toBe('');
    });
});
