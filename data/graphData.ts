/**
 * graphData.ts
 *
 * Imports the pre-generated graphData.json, validates its structure,
 * and exports a frozen, readonly typed object.
 *
 * In development: throws descriptive errors on invalid data.
 * In production: returns safe fallback defaults.
 */

import rawGraphData from './graphData.json';

const REQUIRED_SYMBOLS = [
    'VELOCITY', 'APEXAUTO', 'CRUISER', 'VITALIS',
    'CAREPLUS', 'MEDISURG', 'EDUNEXT', 'SCHOLAR',
    'BRAINB', 'FRESHC', 'SPICER', 'URBANB',
] as const;

export type SymbolKey = (typeof REQUIRED_SYMBOLS)[number];

export type GraphDataMap = Readonly<Record<SymbolKey, readonly number[]>>;

const DEFAULT_FALLBACK_PRICE = 100;
const FALLBACK_LENGTH = 100;

function createFallbackData(): GraphDataMap {
    const fallback: Record<string, number[]> = {};
    for (const sym of REQUIRED_SYMBOLS) {
        fallback[sym] = Array.from({ length: FALLBACK_LENGTH }, () => DEFAULT_FALLBACK_PRICE);
    }
    return Object.freeze(fallback) as GraphDataMap;
}

function validateAndFreeze(data: unknown): GraphDataMap {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('[graphData] Invalid data: expected an object mapping symbols to price arrays.');
    }

    const record = data as Record<string, unknown>;
    const errors: string[] = [];

    for (const sym of REQUIRED_SYMBOLS) {
        if (!(sym in record)) {
            errors.push(`Missing symbol: "${sym}"`);
            continue;
        }

        const arr = record[sym];
        if (!Array.isArray(arr)) {
            errors.push(`Symbol "${sym}" is not an array`);
            continue;
        }

        if (arr.length === 0) {
            errors.push(`Symbol "${sym}" has an empty array`);
            continue;
        }

        for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i] !== 'number' || !Number.isFinite(arr[i])) {
                errors.push(`Symbol "${sym}" has non-finite value at index ${i}: ${arr[i]}`);
                break; // Report first bad value per symbol
            }
        }
    }

    if (errors.length > 0) {
        const msg = `[graphData] Validation errors:\n  - ${errors.join('\n  - ')}`;

        if (import.meta.env?.DEV) {
            throw new Error(msg);
        }

        console.error(msg);
        console.warn('[graphData] Falling back to safe defaults.');
        return createFallbackData();
    }

    // Freeze each array and the top-level object
    for (const sym of REQUIRED_SYMBOLS) {
        Object.freeze(record[sym]);
    }

    return Object.freeze(record) as GraphDataMap;
}

/**
 * Validated + frozen graph data. Keys are company symbols,
 * values are readonly arrays of prices (one per tick / second).
 */
export const graphData: GraphDataMap = validateAndFreeze(rawGraphData);
