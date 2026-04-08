/**
 * Format contact URLs as labeled links for display in resume templates.
 * Returns objects with { label, url } for each non-empty URL field.
 */

import type { ContactInfo } from '../types/resume';

export interface ContactLink {
  label: string;
  url: string;
}

function labelForUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('linkedin')) return 'LinkedIn';
  if (lower.includes('github')) return 'GitHub';
  return 'Portfolio';
}

export function getContactLinks(data: ContactInfo): ContactLink[] {
  const links: ContactLink[] = [];
  if (data.linkedin) links.push({ label: 'LinkedIn', url: data.linkedin });
  if (data.github) links.push({ label: 'GitHub', url: data.github });
  if (data.website) links.push({ label: labelForUrl(data.website), url: data.website });
  return links;
}
