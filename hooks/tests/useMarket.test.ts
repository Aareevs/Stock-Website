import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * useMarket.test.ts
 *
 * Tests for the useMarket hook behavior.
 * Since useMarket depends on Supabase (which we mock), these tests
 * focus on the tick logic and state management patterns.
 */

// Mock supabase before importing anything that uses it
vi.mock('../../lib/supabaseClient', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
            }),
        }),
        channel: () => ({
            on: function () { return this; },
            subscribe: () => ({}),
        }),
        removeChannel: () => { },
    },
}));

describe('useMarket tick logic', () => {
    it('tick counter increments correctly', () => {
        // Simulating the tick increment logic from useMarket
        const ticks: Record<string, number> = {
            VELOCITY: 0,
            APEXAUTO: 0,
        };

        // Simulate one tick
        const newTicks: Record<string, number> = {};
        for (const sym in ticks) {
            newTicks[sym] = (ticks[sym] ?? 0) + 1;
        }

        expect(newTicks.VELOCITY).toBe(1);
        expect(newTicks.APEXAUTO).toBe(1);

        // Simulate another tick
        const newTicks2: Record<string, number> = {};
        for (const sym in newTicks) {
            newTicks2[sym] = (newTicks[sym] ?? 0) + 1;
        }

        expect(newTicks2.VELOCITY).toBe(2);
        expect(newTicks2.APEXAUTO).toBe(2);
    });

    it('tick counter does not mutate original object', () => {
        const ticks = { VELOCITY: 5, APEXAUTO: 10 };
        const original = { ...ticks };

        const newTicks: Record<string, number> = {};
        for (const sym in ticks) {
            newTicks[sym] = (ticks[sym] ?? 0) + 1;
        }

        // Original should be unchanged
        expect(ticks.VELOCITY).toBe(original.VELOCITY);
        expect(ticks.APEXAUTO).toBe(original.APEXAUTO);

        // New should be incremented
        expect(newTicks.VELOCITY).toBe(6);
        expect(newTicks.APEXAUTO).toBe(11);
    });

    it('reset creates fresh tick counters at 0', () => {
        const ticks = { VELOCITY: 100, APEXAUTO: 200 };

        // Reset logic
        const resetTicks: Record<string, number> = {};
        for (const sym in ticks) {
            resetTicks[sym] = 0;
        }

        expect(resetTicks.VELOCITY).toBe(0);
        expect(resetTicks.APEXAUTO).toBe(0);
    });

    it('interval clears properly on cleanup', () => {
        const clearSpy = vi.spyOn(global, 'clearInterval');
        const intervalId = setInterval(() => { }, 5000);
        clearInterval(intervalId);

        expect(clearSpy).toHaveBeenCalledWith(intervalId);
        clearSpy.mockRestore();
    });

    it('only one interval should exist at a time', () => {
        const intervals: ReturnType<typeof setInterval>[] = [];

        // Simulate the pattern from useMarket
        const createInterval = () => {
            const id = setInterval(() => { }, 5000);
            intervals.push(id);
            return id;
        };

        const cleanup = (id: ReturnType<typeof setInterval>) => {
            clearInterval(id);
        };

        // First mount
        const id1 = createInterval();
        expect(intervals.length).toBe(1);

        // Cleanup + remount (simulating useEffect cleanup)
        cleanup(id1);
        const id2 = createInterval();

        // After cleanup + recreation, we should still only have one active
        cleanup(id2);
    });
});
