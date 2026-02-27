import { describe, it, expect } from 'vitest';
import { tickPrice, tickAllPrices, applyNewsEvent, stopNewsEvent } from '../priceEngine';
import type { MarketItem, NewsEvent } from '../../types';

function createMockItem(symbol: string, price: number = 100): MarketItem {
    return {
        name: `Test ${symbol}`,
        symbol,
        price,
        change: 0,
        sentiment: 'Neutral',
        sector: 'Test',
        icon: 'T',
        priceHistory: [],
    };
}

function createMockNewsEvent(overrides: Partial<NewsEvent> = {}): NewsEvent {
    return {
        id: 'test-event-1',
        headline: 'Test News',
        crashCompany: 'VELOCITY',
        crashPercent: -15,
        boostCompanies: ['APEXAUTO'],
        boostPercent: 8,
        timestamp: Date.now(),
        active: true,
        ...overrides,
    };
}

describe('tickPrice (graph-driven)', () => {
    it('returns a new MarketItem without mutating the original', () => {
        const item = createMockItem('VELOCITY');
        const original = { ...item };
        const result = tickPrice(item, 0);

        // Original should be unchanged
        expect(item.price).toBe(original.price);
        expect(item.priceHistory).toBe(original.priceHistory);

        // Result should be a new object
        expect(result).not.toBe(item);
        expect(typeof result.price).toBe('number');
        expect(result.priceHistory.length).toBe(1);
    });

    it('produces prices from graph data at the given tick', () => {
        const item = createMockItem('VELOCITY');
        const r0 = tickPrice(item, 0);
        const r5 = tickPrice(item, 5);

        expect(Number.isFinite(r0.price)).toBe(true);
        expect(Number.isFinite(r5.price)).toBe(true);
        expect(r0.price).toBeGreaterThanOrEqual(10);
        expect(r5.price).toBeGreaterThanOrEqual(10);
    });

    it('applies news crash override on top of graph price', () => {
        const item = createMockItem('VELOCITY', 200);
        const event = createMockNewsEvent({ crashCompany: 'VELOCITY', crashPercent: -20 });

        const withoutNews = tickPrice(item, 10);
        const withNews = tickPrice(item, 10, [event]);

        // With a 20% crash, the price should be lower
        expect(withNews.price).toBeLessThan(withoutNews.price);
    });

    it('applies news boost override on top of graph price', () => {
        const item = createMockItem('APEXAUTO', 200);
        const event = createMockNewsEvent({ boostCompanies: ['APEXAUTO'], boostPercent: 10 });

        const withoutNews = tickPrice(item, 10);
        const withNews = tickPrice(item, 10, [event]);

        // With a 10% boost, the price should be higher
        expect(withNews.price).toBeGreaterThan(withoutNews.price);
    });

    it('resumes normal graph playback after news stops', () => {
        const item = createMockItem('VELOCITY', 200);
        const inactiveEvent = createMockNewsEvent({ active: false });

        const normal = tickPrice(item, 10);
        const afterStop = tickPrice(item, 10, [inactiveEvent]);

        // With inactive event, should be same as no event
        expect(afterStop.price).toBe(normal.price);
    });

    it('computes change percentage correctly', () => {
        const item = createMockItem('VELOCITY', 100);
        // Add an initial history point
        const itemWithHistory: MarketItem = {
            ...item,
            priceHistory: [{ time: '10:00:00 AM', value: 100 }],
        };

        const result = tickPrice(itemWithHistory, 5);
        // Change should be ((newPrice - 100) / 100) * 100
        const expectedChange = ((result.price - 100) / 100) * 100;
        expect(result.change).toBeCloseTo(expectedChange, 1);
    });

    it('caps priceHistory at 200 entries', () => {
        const longHistory = Array.from({ length: 250 }, (_, i) => ({
            time: `${i}`,
            value: 100 + i,
        }));
        const item: MarketItem = {
            ...createMockItem('VELOCITY'),
            priceHistory: longHistory,
        };

        const result = tickPrice(item, 0);
        expect(result.priceHistory.length).toBeLessThanOrEqual(200);
    });
});

describe('tickAllPrices', () => {
    it('ticks all items independently using their own tick counters', () => {
        const items = [
            createMockItem('VELOCITY'),
            createMockItem('APEXAUTO'),
        ];
        const ticks = { VELOCITY: 10, APEXAUTO: 20 };

        const result = tickAllPrices(items, ticks);

        expect(result.length).toBe(2);
        expect(result[0].symbol).toBe('VELOCITY');
        expect(result[1].symbol).toBe('APEXAUTO');
        // Both should have valid prices
        expect(Number.isFinite(result[0].price)).toBe(true);
        expect(Number.isFinite(result[1].price)).toBe(true);
    });

    it('does not mutate the original array', () => {
        const items = [createMockItem('VELOCITY')];
        const ticks = { VELOCITY: 0 };
        const result = tickAllPrices(items, ticks);

        expect(result).not.toBe(items);
        expect(result[0]).not.toBe(items[0]);
    });
});

describe('applyNewsEvent', () => {
    it('crashes the target company', () => {
        const items = [createMockItem('VELOCITY', 1000)];
        const event = createMockNewsEvent({ crashCompany: 'VELOCITY', crashPercent: -20 });

        const result = applyNewsEvent(items, event);
        expect(result[0].price).toBe(800); // 1000 * (1 - 0.20)
        expect(result[0].sentiment).toBe('Bearish');
    });

    it('boosts benefiting companies', () => {
        const items = [createMockItem('APEXAUTO', 1000)];
        const event = createMockNewsEvent({ boostCompanies: ['APEXAUTO'], boostPercent: 10 });

        const result = applyNewsEvent(items, event);
        expect(result[0].price).toBe(1100); // 1000 * (1 + 0.10)
        expect(result[0].sentiment).toBe('Bullish');
    });

    it('does not affect unrelated stocks', () => {
        const items = [createMockItem('CRUISER', 500)];
        const event = createMockNewsEvent();

        const result = applyNewsEvent(items, event);
        expect(result[0].price).toBe(500);
        expect(result[0].sentiment).toBe('Neutral');
    });
});

describe('stopNewsEvent', () => {
    it('reverts affected stocks to Neutral sentiment', () => {
        const items = [
            { ...createMockItem('VELOCITY', 800), sentiment: 'Bearish' as const },
            { ...createMockItem('APEXAUTO', 1100), sentiment: 'Bullish' as const },
            { ...createMockItem('CRUISER', 500), sentiment: 'Neutral' as const },
        ];
        const event = createMockNewsEvent();

        const result = stopNewsEvent(items, event);
        expect(result[0].sentiment).toBe('Neutral');
        expect(result[1].sentiment).toBe('Neutral');
        expect(result[2].sentiment).toBe('Neutral');
    });
});
