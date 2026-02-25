/**
 * graphPlaybackEngine.ts
 *
 * Pure, deterministic graph price lookup.
 * O(1) per call. No side effects, no React, no Supabase.
 */

import { graphData, type SymbolKey } from '../data/graphData';

const MIN_PRICE = 10;
const FALLBACK_PRICE = 100;

/**
 * Get the graph-driven price for a given symbol at a given tick.
 *
 * Rules:
 *  - Clamps tick to [0, arr.length - 1]
 *  - Clamps result to minimum ₹10
 *  - Rounds to 2 decimal places
 *  - Returns FALLBACK_PRICE for unknown symbols
 *  - Never returns NaN, never throws
 */
export function getGraphPrice(symbol: string, tick: number): number {
    const prices = graphData[symbol as SymbolKey];

    // Unknown symbol → safe fallback
    if (!prices || prices.length === 0) {
        return FALLBACK_PRICE;
    }

    // Clamp tick
    const safeTick = Math.max(0, Math.min(tick, prices.length - 1));
    const rawPrice = prices[safeTick];

    // Guard against corrupted data
    if (typeof rawPrice !== 'number' || !Number.isFinite(rawPrice)) {
        return FALLBACK_PRICE;
    }

    // Clamp minimum and round
    return parseFloat(Math.max(MIN_PRICE, rawPrice).toFixed(2));
}

/**
 * Get the total number of ticks available for a given symbol.
 * Returns 0 for unknown symbols.
 */
export function getGraphLength(symbol: string): number {
    const prices = graphData[symbol as SymbolKey];
    return prices ? prices.length : 0;
}
