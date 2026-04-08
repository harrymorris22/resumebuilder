import { describe, it, expect } from 'vitest';
import { getContactLinks } from './contactLinks';
import type { ContactInfo } from '../types/resume';

describe('getContactLinks', () => {
  const base: ContactInfo = { fullName: '', email: '', phone: '', location: '' };

  it('returns empty array when no URLs are set', () => {
    expect(getContactLinks(base)).toEqual([]);
  });

  it('returns LinkedIn link with label', () => {
    const data = { ...base, linkedin: 'https://linkedin.com/in/jane' };
    const links = getContactLinks(data);
    expect(links).toEqual([{ label: 'LinkedIn', url: 'https://linkedin.com/in/jane' }]);
  });

  it('returns GitHub link with label', () => {
    const data = { ...base, github: 'https://github.com/jane' };
    const links = getContactLinks(data);
    expect(links).toEqual([{ label: 'GitHub', url: 'https://github.com/jane' }]);
  });

  it('returns Portfolio label for generic website', () => {
    const data = { ...base, website: 'https://janesmith.dev' };
    const links = getContactLinks(data);
    expect(links).toEqual([{ label: 'Portfolio', url: 'https://janesmith.dev' }]);
  });

  it('detects LinkedIn label from website URL', () => {
    const data = { ...base, website: 'https://linkedin.com/in/jane' };
    const links = getContactLinks(data);
    expect(links[0].label).toBe('LinkedIn');
  });

  it('detects GitHub label from website URL', () => {
    const data = { ...base, website: 'https://github.com/jane' };
    const links = getContactLinks(data);
    expect(links[0].label).toBe('GitHub');
  });

  it('returns all three links in order', () => {
    const data = {
      ...base,
      linkedin: 'https://linkedin.com/in/jane',
      github: 'https://github.com/jane',
      website: 'https://janesmith.dev',
    };
    const links = getContactLinks(data);
    expect(links).toHaveLength(3);
    expect(links[0].label).toBe('LinkedIn');
    expect(links[1].label).toBe('GitHub');
    expect(links[2].label).toBe('Portfolio');
  });

  it('skips empty string fields', () => {
    const data = { ...base, linkedin: '', github: '', website: '' };
    expect(getContactLinks(data)).toEqual([]);
  });

  it('skips undefined fields', () => {
    const data = { ...base, linkedin: undefined, github: undefined, website: undefined };
    expect(getContactLinks(data)).toEqual([]);
  });
});
