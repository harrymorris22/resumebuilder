import { describe, it, expect } from 'vitest';
import { createPoolEntriesFromTool, isDuplicatePoolEntry } from './poolSync';
import type { ContentPoolEntry, Resume } from '../types/resume';

// --- createPoolEntriesFromTool ---

describe('createPoolEntriesFromTool', () => {
  it('returns skill_category entry for add_skills', () => {
    const entries = createPoolEntriesFromTool('add_skills', {
      categoryName: 'Languages',
      skills: ['Python', 'TypeScript'],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].item.type).toBe('skill_category');
    expect(entries[0].source).toBe('ai');
    if (entries[0].item.type === 'skill_category') {
      expect(entries[0].item.data.name).toBe('Languages');
      expect(entries[0].item.data.skills).toEqual(['Python', 'TypeScript']);
    }
  });

  it('returns bullet entries for add_experience', () => {
    const entries = createPoolEntriesFromTool('add_experience', {
      company: 'Acme',
      title: 'SWE',
      location: 'NYC',
      startDate: 'Jan 2020',
      endDate: null,
      bullets: ['Built APIs', 'Led team'],
    });
    expect(entries).toHaveLength(2);
    expect(entries[0].item.type).toBe('bullet');
    if (entries[0].item.type === 'bullet') {
      expect(entries[0].item.data.text).toBe('Built APIs');
      expect(entries[0].item.context.company).toBe('Acme');
      expect(entries[0].item.context.title).toBe('SWE');
      expect(entries[0].item.context.endDate).toBeNull();
    }
  });

  it('returns bullet entries for update_experience_bullets with resume context', () => {
    const resume: Resume = {
      id: 'r1',
      name: 'Test',
      createdAt: '',
      updatedAt: '',
      templateId: 'classic',
      sections: [
        {
          id: 's1',
          order: 0,
          visible: true,
          content: {
            type: 'experience',
            data: {
              items: [
                {
                  id: 'exp1',
                  company: 'BigCo',
                  title: 'Engineer',
                  location: 'SF',
                  dateRange: { start: 'Jan 2021', end: 'Dec 2023' },
                  bullets: [],
                },
              ],
            },
          },
        },
      ],
    };
    const entries = createPoolEntriesFromTool(
      'update_experience_bullets',
      { experienceId: 'exp1', bullets: ['New bullet'] },
      resume,
    );
    expect(entries).toHaveLength(1);
    if (entries[0].item.type === 'bullet') {
      expect(entries[0].item.data.text).toBe('New bullet');
      expect(entries[0].item.context.company).toBe('BigCo');
      expect(entries[0].item.context.title).toBe('Engineer');
    }
  });

  it('returns education entry for add_education', () => {
    const entries = createPoolEntriesFromTool('add_education', {
      institution: 'MIT',
      degree: 'BS',
      field: 'CS',
      startDate: '2016',
      endDate: '2020',
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].item.type).toBe('education');
    if (entries[0].item.type === 'education') {
      expect(entries[0].item.data.institution).toBe('MIT');
      expect(entries[0].item.data.degree).toBe('BS');
      expect(entries[0].item.data.field).toBe('CS');
    }
  });

  it('returns certification entry for add_certification', () => {
    const entries = createPoolEntriesFromTool('add_certification', {
      name: 'AWS SA',
      issuer: 'Amazon',
      date: '2023',
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].item.type).toBe('certification');
    if (entries[0].item.type === 'certification') {
      expect(entries[0].item.data.name).toBe('AWS SA');
      expect(entries[0].item.data.issuer).toBe('Amazon');
    }
  });

  it('returns project entry for add_project', () => {
    const entries = createPoolEntriesFromTool('add_project', {
      name: 'Resume Builder',
      description: 'AI-powered resume tool',
      technologies: ['React', 'TypeScript'],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].item.type).toBe('project');
    if (entries[0].item.type === 'project') {
      expect(entries[0].item.data.name).toBe('Resume Builder');
      expect(entries[0].item.data.technologies).toEqual(['React', 'TypeScript']);
    }
  });

  it('returns summary entry for set_summary', () => {
    const entries = createPoolEntriesFromTool('set_summary', {
      text: 'Experienced engineer...',
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].item.type).toBe('summary');
    if (entries[0].item.type === 'summary') {
      expect(entries[0].item.data.text).toBe('Experienced engineer...');
    }
  });

  it('returns contact entry for update_contact', () => {
    const entries = createPoolEntriesFromTool('update_contact', {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-1234',
      location: 'NYC',
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].item.type).toBe('contact');
    if (entries[0].item.type === 'contact') {
      expect(entries[0].item.data.fullName).toBe('Jane Doe');
      expect(entries[0].item.data.email).toBe('jane@example.com');
    }
  });

  it('returns empty array for unknown tool', () => {
    const entries = createPoolEntriesFromTool('unknown_tool', { foo: 'bar' });
    expect(entries).toEqual([]);
  });
});

// --- isDuplicatePoolEntry ---

function makePoolEntry(item: ContentPoolEntry['item']): ContentPoolEntry {
  return { id: 'existing', item, source: 'upload', createdAt: '', updatedAt: '' };
}

function makeNewEntry(item: ContentPoolEntry['item']): ContentPoolEntry {
  return { id: 'new', item, source: 'ai', createdAt: '', updatedAt: '' };
}

describe('isDuplicatePoolEntry', () => {
  it('detects duplicate bullet by text+company+title', () => {
    const pool = [
      makePoolEntry({
        type: 'bullet',
        data: { text: 'Built APIs' },
        context: { company: 'Acme', title: 'SWE', location: '', startDate: '', endDate: null },
      }),
    ];
    const entry = makeNewEntry({
      type: 'bullet',
      data: { text: 'Built APIs' },
      context: { company: 'Acme', title: 'SWE', location: '', startDate: '', endDate: null },
    });
    expect(isDuplicatePoolEntry(entry, pool)).toBe(true);
  });

  it('does not match bullet with different text', () => {
    const pool = [
      makePoolEntry({
        type: 'bullet',
        data: { text: 'Built APIs' },
        context: { company: 'Acme', title: 'SWE', location: '', startDate: '', endDate: null },
      }),
    ];
    const entry = makeNewEntry({
      type: 'bullet',
      data: { text: 'Led team' },
      context: { company: 'Acme', title: 'SWE', location: '', startDate: '', endDate: null },
    });
    expect(isDuplicatePoolEntry(entry, pool)).toBe(false);
  });

  it('detects duplicate skill_category by name (case-insensitive)', () => {
    const pool = [
      makePoolEntry({ type: 'skill_category', data: { id: 'x', name: 'Languages', skills: ['Python'] } }),
    ];
    const entry = makeNewEntry({
      type: 'skill_category',
      data: { id: 'y', name: 'languages', skills: ['TypeScript'] },
    });
    expect(isDuplicatePoolEntry(entry, pool)).toBe(true);
  });

  it('detects duplicate education by institution+degree', () => {
    const pool = [
      makePoolEntry({
        type: 'education',
        data: { id: 'x', institution: 'MIT', degree: 'BS', field: 'CS', dateRange: { start: '', end: null } },
      }),
    ];
    const entry = makeNewEntry({
      type: 'education',
      data: { id: 'y', institution: 'MIT', degree: 'BS', field: 'EE', dateRange: { start: '', end: null } },
    });
    expect(isDuplicatePoolEntry(entry, pool)).toBe(true);
  });

  it('detects duplicate summary by type', () => {
    const pool = [
      makePoolEntry({ type: 'summary', data: { text: 'Old summary' } }),
    ];
    const entry = makeNewEntry({ type: 'summary', data: { text: 'New summary' } });
    expect(isDuplicatePoolEntry(entry, pool)).toBe(true);
  });

  it('detects duplicate contact by type', () => {
    const pool = [
      makePoolEntry({
        type: 'contact',
        data: { fullName: 'Jane', email: '', phone: '', location: '' },
      }),
    ];
    const entry = makeNewEntry({
      type: 'contact',
      data: { fullName: 'John', email: '', phone: '', location: '' },
    });
    expect(isDuplicatePoolEntry(entry, pool)).toBe(true);
  });

  it('detects duplicate project by name', () => {
    const pool = [
      makePoolEntry({
        type: 'project',
        data: { id: 'x', name: 'MyApp', description: '', technologies: [], bullets: [] },
      }),
    ];
    const entry = makeNewEntry({
      type: 'project',
      data: { id: 'y', name: 'MyApp', description: 'updated', technologies: [], bullets: [] },
    });
    expect(isDuplicatePoolEntry(entry, pool)).toBe(true);
  });

  it('detects duplicate certification by name', () => {
    const pool = [
      makePoolEntry({
        type: 'certification',
        data: { id: 'x', name: 'AWS SA', issuer: 'Amazon', date: '2023' },
      }),
    ];
    const entry = makeNewEntry({
      type: 'certification',
      data: { id: 'y', name: 'AWS SA', issuer: 'Amazon', date: '2024' },
    });
    expect(isDuplicatePoolEntry(entry, pool)).toBe(true);
  });

  it('returns false for empty pool', () => {
    const entry = makeNewEntry({ type: 'summary', data: { text: 'Something' } });
    expect(isDuplicatePoolEntry(entry, [])).toBe(false);
  });
});
