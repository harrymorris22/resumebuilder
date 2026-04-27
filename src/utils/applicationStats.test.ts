import { describe, it, expect } from 'vitest';
import {
  isTerminal,
  daysSince,
  countByStatus,
  activeCount,
  interviewsThisWeek,
  responseRate,
  offerRate,
  pipelineCounts,
} from './applicationStats';
import type { Application, ApplicationEvent, ApplicationStatus } from '../types/resume';

function mkEvent(status: ApplicationStatus, date = '2026-04-01T00:00:00Z'): ApplicationEvent {
  return { id: `ev-${status}-${date}`, status, date };
}

function mkApp(overrides: Partial<Application> = {}): Application {
  return {
    id: `app-${Math.random()}`,
    resumeId: `res-${Math.random()}`,
    jobDescriptionId: 'jd-1',
    company: 'Acme',
    role: 'SWE',
    status: 'draft',
    appliedAt: null,
    events: [mkEvent('draft')],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

describe('isTerminal', () => {
  it('returns true for terminal statuses', () => {
    expect(isTerminal('rejected')).toBe(true);
    expect(isTerminal('withdrawn')).toBe(true);
    expect(isTerminal('ghosted')).toBe(true);
  });
  it('returns false for non-terminal statuses', () => {
    expect(isTerminal('draft')).toBe(false);
    expect(isTerminal('applied')).toBe(false);
    expect(isTerminal('phone_screen')).toBe(false);
    expect(isTerminal('interview')).toBe(false);
    expect(isTerminal('final_round')).toBe(false);
    expect(isTerminal('offer')).toBe(false);
  });
});

describe('daysSince', () => {
  it('computes whole-day difference', () => {
    const now = new Date('2026-04-10T12:00:00Z');
    expect(daysSince('2026-04-08T12:00:00Z', now)).toBe(2);
  });
  it('returns 0 for same timestamp', () => {
    const now = new Date('2026-04-10T12:00:00Z');
    expect(daysSince('2026-04-10T12:00:00Z', now)).toBe(0);
  });
  it('clamps to 0 for future dates', () => {
    const now = new Date('2026-04-10T12:00:00Z');
    expect(daysSince('2026-05-01T12:00:00Z', now)).toBe(0);
  });
  it('returns 0 for invalid ISO string', () => {
    expect(daysSince('garbage')).toBe(0);
  });
});

describe('countByStatus', () => {
  it('returns zeros for empty array', () => {
    const counts = countByStatus([]);
    expect(counts.draft).toBe(0);
    expect(counts.applied).toBe(0);
    expect(counts.offer).toBe(0);
    expect(counts.rejected).toBe(0);
  });
  it('counts each status independently', () => {
    const apps: Application[] = [
      mkApp({ status: 'draft' }),
      mkApp({ status: 'applied' }),
      mkApp({ status: 'applied' }),
      mkApp({ status: 'offer' }),
      mkApp({ status: 'rejected' }),
    ];
    const counts = countByStatus(apps);
    expect(counts.draft).toBe(1);
    expect(counts.applied).toBe(2);
    expect(counts.offer).toBe(1);
    expect(counts.rejected).toBe(1);
    expect(counts.phone_screen).toBe(0);
  });
});

describe('activeCount', () => {
  it('excludes terminal statuses', () => {
    const apps: Application[] = [
      mkApp({ status: 'draft' }),
      mkApp({ status: 'applied' }),
      mkApp({ status: 'rejected' }),
      mkApp({ status: 'withdrawn' }),
      mkApp({ status: 'ghosted' }),
    ];
    expect(activeCount(apps)).toBe(2);
  });
  it('returns 0 for all-terminal', () => {
    const apps: Application[] = [
      mkApp({ status: 'rejected' }),
      mkApp({ status: 'ghosted' }),
    ];
    expect(activeCount(apps)).toBe(0);
  });
  it('returns 0 for empty input', () => {
    expect(activeCount([])).toBe(0);
  });
});

describe('interviewsThisWeek', () => {
  it('counts apps with nextStepDate in next 7 days and interview-ish status', () => {
    // Local noon anchor avoids TZ edge cases on the window boundary.
    const now = new Date(2026, 3, 10, 12, 0, 0); // Apr 10 2026 local noon
    const inWindow = new Date(2026, 3, 13, 10, 0, 0).toISOString(); // Apr 13 local — inside
    const outOfWindow = new Date(2026, 3, 20, 10, 0, 0).toISOString(); // Apr 20 — outside
    const apps: Application[] = [
      mkApp({ status: 'interview', nextStepDate: inWindow }),
      mkApp({ status: 'phone_screen', nextStepDate: inWindow }),
      mkApp({ status: 'final_round', nextStepDate: inWindow }),
      mkApp({ status: 'interview', nextStepDate: outOfWindow }), // outside window
      mkApp({ status: 'applied', nextStepDate: inWindow }), // wrong status
      mkApp({ status: 'interview', nextStepDate: null }), // no date
    ];
    expect(interviewsThisWeek(apps, now)).toBe(3);
  });
  it('returns 0 for empty input', () => {
    expect(interviewsThisWeek([], new Date())).toBe(0);
  });
  it('ignores invalid nextStepDate', () => {
    const now = new Date(2026, 3, 10);
    const apps: Application[] = [
      mkApp({ status: 'interview', nextStepDate: 'not-a-date' }),
    ];
    expect(interviewsThisWeek(apps, now)).toBe(0);
  });
});

describe('responseRate', () => {
  it('returns 0 for empty input', () => {
    expect(responseRate([])).toBe(0);
  });
  it('returns 0 when no apps were ever applied', () => {
    const apps: Application[] = [mkApp({ status: 'draft' })];
    expect(responseRate(apps)).toBe(0);
  });
  it('computes numerator / denominator', () => {
    const apps: Application[] = [
      // responded
      mkApp({
        status: 'phone_screen',
        events: [mkEvent('draft'), mkEvent('applied'), mkEvent('phone_screen')],
      }),
      // applied but no response
      mkApp({
        status: 'applied',
        events: [mkEvent('draft'), mkEvent('applied')],
      }),
      // ghosted after apply (no phone_screen+ event) — counts in denom only
      mkApp({
        status: 'ghosted',
        events: [mkEvent('draft'), mkEvent('applied'), mkEvent('ghosted')],
      }),
      // never applied — ignored entirely
      mkApp({ status: 'draft', events: [mkEvent('draft')] }),
    ];
    expect(responseRate(apps)).toBeCloseTo(1 / 3, 5);
  });
});

describe('offerRate', () => {
  it('returns 0 for empty input', () => {
    expect(offerRate([])).toBe(0);
  });
  it('returns 0 for all-draft (no one past draft)', () => {
    const apps: Application[] = [mkApp({ status: 'draft' })];
    expect(offerRate(apps)).toBe(0);
  });
  it('computes offers over apps past draft', () => {
    const apps: Application[] = [
      mkApp({
        status: 'offer',
        events: [mkEvent('draft'), mkEvent('applied'), mkEvent('offer')],
      }),
      mkApp({
        status: 'applied',
        events: [mkEvent('draft'), mkEvent('applied')],
      }),
      mkApp({
        status: 'rejected',
        events: [mkEvent('draft'), mkEvent('applied'), mkEvent('rejected')],
      }),
    ];
    expect(offerRate(apps)).toBeCloseTo(1 / 3, 5);
  });
});

describe('pipelineCounts', () => {
  it('returns zeros for empty input', () => {
    expect(pipelineCounts([])).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it('returns counts in PIPELINE_STAGES order (draft, applied, phone_screen, interview, final_round, offer)', () => {
    const apps: Application[] = [
      mkApp({ status: 'draft' }),
      mkApp({ status: 'applied' }),
      mkApp({ status: 'applied' }),
      mkApp({ status: 'phone_screen' }),
      mkApp({ status: 'interview' }),
      mkApp({ status: 'interview' }),
      mkApp({ status: 'interview' }),
      mkApp({ status: 'final_round' }),
      mkApp({ status: 'offer' }),
      mkApp({ status: 'rejected' }), // excluded — terminal
      mkApp({ status: 'ghosted' }), // excluded — terminal
    ];
    expect(pipelineCounts(apps)).toEqual([1, 2, 1, 3, 1, 1]);
  });
});
