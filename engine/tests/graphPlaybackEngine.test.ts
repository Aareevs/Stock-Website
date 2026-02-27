import { describe, it, expect } from 'vitest';
import { getGraphPrice, getGraphLength } from '../graphPlaybackEngine';

describe('getGraphPrice', () => {
    it('returns a finite number for tick 0 of a known symbol', () => {
        const price = getGraphPrice('VELOCITY', 0);
        expect(typeof price).toBe('number');
        expect(Number.isFinite(price)).toBe(true);
        expect(price).toBeGreaterThanOrEqual(10);
    });

    it('returns correct tick retrieval (different ticks give potentially different prices)', () => {
        const p0 = getGraphPrice('VELOCITY', 0);
        const p10 = getGraphPrice('VELOCITY', 10);
        // At minimum both should be valid numbers
        expect(Number.isFinite(p0)).toBe(true);
        expect(Number.isFinite(p10)).toBe(true);
    });

    it('clamps tick beyond array length to last price', () => {
        const len = getGraphLength('VELOCITY');
        expect(len).toBeGreaterThan(0);

        const lastPrice = getGraphPrice('VELOCITY', len - 1);
        const beyondPrice = getGraphPrice('VELOCITY', len + 1000);
        expect(beyondPrice).toBe(lastPrice);
    });

    it('clamps negative tick to 0', () => {
        const p0 = getGraphPrice('VELOCITY', 0);
        const pNeg = getGraphPrice('VELOCITY', -5);
        expect(pNeg).toBe(p0);
    });

    it('enforces minimum price of ₹10', () => {
        // All prices from the graph should be >= 10
        for (let tick = 0; tick < 100; tick++) {
            const price = getGraphPrice('VELOCITY', tick);
            expect(price).toBeGreaterThanOrEqual(10);
        }
    });

    it('returns prices rounded to 2 decimal places', () => {
        const price = getGraphPrice('VELOCITY', 5);
        const decimals = price.toString().split('.')[1];
        if (decimals) {
            expect(decimals.length).toBeLessThanOrEqual(2);
        }
    });

    it('returns fallback price for unknown symbol', () => {
        const price = getGraphPrice('UNKNOWN_SYMBOL', 0);
        expect(price).toBe(100); // FALLBACK_PRICE
    });

    it('returns fallback price for empty string symbol', () => {
        const price = getGraphPrice('', 0);
        expect(price).toBe(100);
    });

    it('never returns NaN', () => {
        const symbols = ['VELOCITY', 'APEXAUTO', 'CRUISER', 'UNKNOWN', '', 'null'];
        const ticks = [-1, 0, 1, 100, 99999, NaN];
        for (const sym of symbols) {
            for (const tick of ticks) {
                const price = getGraphPrice(sym, tick);
                expect(Number.isNaN(price)).toBe(false);
            }
        }
    });

    it('works for all 12 symbols', () => {
        const symbols = [
            'VELOCITY', 'APEXAUTO', 'CRUISER', 'VITALIS',
            'CAREPLUS', 'MEDISURG', 'EDUNEXT', 'SCHOLAR',
            'BRAINB', 'FRESHC', 'SPICER', 'URBANB',
        ];
        for (const sym of symbols) {
            const price = getGraphPrice(sym, 0);
            expect(typeof price).toBe('number');
            expect(Number.isFinite(price)).toBe(true);
            expect(price).toBeGreaterThanOrEqual(10);
            expect(getGraphLength(sym)).toBeGreaterThan(0);
        }
    });
});

describe('getGraphLength', () => {
    it('returns > 0 for known symbols', () => {
        expect(getGraphLength('VELOCITY')).toBeGreaterThan(0);
    });

    it('returns 0 for unknown symbols', () => {
        expect(getGraphLength('UNKNOWN')).toBe(0);
    });
});
