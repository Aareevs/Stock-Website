/**
 * scheduledNews.ts
 *
 * Pre-configured news flash events that auto-fire during the 2-hour event.
 * Each flash crashes one company in a sector and boosts its sector rivals.
 * EdTech is the untouched "safe haven" sector.
 */

export interface ScheduledNewsEvent {
  /** Tick at which this event auto-fires (1 tick = 1 second) */
  triggerTick: number;
  /** How many ticks the event stays active before auto-stopping */
  durationTicks: number;
  /** Headline shown to participants */
  headline: string;
  /** Symbol of the company that crashes */
  crashCompany: string;
  /** Crash percentage (negative value, e.g. -15) */
  crashPercent: number;
  /** Symbols of companies that benefit (same-sector rivals) */
  boostCompanies: string[];
  /** Boost percentage (positive value, e.g. 8) */
  boostPercent: number;
  /** Sector being hit */
  sector: string;
}

export const SCHEDULED_NEWS: ScheduledNewsEvent[] = [
  {
    triggerTick: 1800, // 30 minutes
    durationTicks: 900, // auto-stop after 15 minutes (runs 30m→45m)
    headline: 'BREAKING: Velocity Auto Recalls 50,000 Vehicles Over Safety Defect',
    crashCompany: 'VELOCITY',
    crashPercent: -15,
    boostCompanies: ['APEXAUTO', 'CRUISER'],
    boostPercent: 8,
    sector: 'Automobile',
  },
  {
    triggerTick: 3600, // 1 hour
    durationTicks: 900, // auto-stop after 15 minutes (runs 60m→75m)
    headline: 'FLASH: CarePlus Hospitals Under Investigation for Insurance Fraud',
    crashCompany: 'CAREPLUS',
    crashPercent: -20,
    boostCompanies: ['VITALIS', 'MEDISURG'],
    boostPercent: 8,
    sector: 'Health',
  },
  {
    triggerTick: 5400, // 1 hour 30 minutes
    durationTicks: 900, // auto-stop after 15 minutes (runs 90m→105m)
    headline: 'ALERT: UrbanBites Hit with Major Food Safety Violation',
    crashCompany: 'URBANB',
    crashPercent: -9,
    boostCompanies: ['FRESHC', 'SPICER'],
    boostPercent: 8,
    sector: 'Food',
  },
];
