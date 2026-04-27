import type { Application, ApplicationStatus } from '../types/resume';
import { TERMINAL_STATUSES, ACTIVE_STATUSES, PIPELINE_STAGES } from '../types/resume';

/**
 * Pure functions over Application[]. Used by ApplicationsPage tiles,
 * sparkline, and filter predicates. No React, no side effects.
 */

export function isTerminal(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Whole-day count from `iso` to `now` (default: current time). Negative values
 * clamp to 0 so "days since future date" never goes below zero.
 */
export function daysSince(iso: string, now: Date = new Date()): number {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 0;
  const diffMs = now.getTime() - then;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function countByStatus(
  apps: Application[],
): Record<ApplicationStatus, number> {
  const counts: Record<ApplicationStatus, number> = {
    draft: 0,
    applied: 0,
    phone_screen: 0,
    interview: 0,
    final_round: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
    ghosted: 0,
  };
  for (const a of apps) counts[a.status] += 1;
  return counts;
}

export function activeCount(apps: Application[]): number {
  return apps.filter((a) => !isTerminal(a.status)).length;
}

/**
 * Count of apps whose `nextStepDate` falls within the local calendar week
 * starting at `now` (today's local midnight through +7 local days) AND whose
 * status is phone_screen / interview / final_round.
 *
 * `now` is required and used as the local-timezone anchor. We compare by local
 * day boundaries, NOT raw UTC hour-diff, so "this week" is what the user's
 * calendar shows regardless of timezone.
 */
export function interviewsThisWeek(apps: Application[], now: Date): number {
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const endOfWindow = startOfDay + 7 * 24 * 60 * 60 * 1000;
  const relevant: ApplicationStatus[] = ['phone_screen', 'interview', 'final_round'];

  return apps.filter((a) => {
    if (!a.nextStepDate) return false;
    if (!relevant.includes(a.status)) return false;
    const ts = Date.parse(a.nextStepDate);
    if (Number.isNaN(ts)) return false;
    return ts >= startOfDay && ts < endOfWindow;
  }).length;
}

/**
 * Denominator: apps that were ever applied (events include an ACTIVE status).
 * Numerator: apps that reached phone_screen or beyond (past just 'applied').
 * Returns 0..1; empty denominator → 0 (not NaN).
 */
export function responseRate(apps: Application[]): number {
  // Derived from ACTIVE_STATUSES minus 'applied' so it stays in sync
  // if new active statuses are added to the canonical list.
  const BEYOND_APPLIED = ACTIVE_STATUSES.filter((s) => s !== 'applied');
  let denom = 0;
  let numer = 0;
  for (const a of apps) {
    const everApplied = a.events.some((e) => e.status === 'applied');
    if (!everApplied) continue;
    denom += 1;
    const gotResponse = a.events.some((e) => (BEYOND_APPLIED as readonly ApplicationStatus[]).includes(e.status));
    if (gotResponse) numer += 1;
  }
  if (denom === 0) return 0;
  return numer / denom;
}

/**
 * Denominator: apps past 'draft' (ever had an ACTIVE status event).
 * Numerator: apps with any 'offer' event.
 * Returns 0..1; empty denominator → 0.
 */
export function offerRate(apps: Application[]): number {
  let denom = 0;
  let numer = 0;
  for (const a of apps) {
    const pastDraft = a.events.some((e) => e.status !== 'draft');
    if (!pastDraft) continue;
    denom += 1;
    const gotOffer = a.events.some((e) => e.status === 'offer');
    if (gotOffer) numer += 1;
  }
  if (denom === 0) return 0;
  return numer / denom;
}

/**
 * Counts for each non-terminal pipeline stage, in order:
 * [draft, applied, phone_screen, interview, final_round, offer].
 * Used by the sparkline.
 */
export function pipelineCounts(apps: Application[]): number[] {
  const counts = countByStatus(apps);
  return PIPELINE_STAGES.map((stage) => counts[stage]);
}
