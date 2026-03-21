import { generateId } from './id';
import type { Resume, ResumeSection } from '../types/resume';

export function createDefaultSections(): ResumeSection[] {
  return [
    {
      id: generateId(),
      order: 0,
      visible: true,
      content: {
        type: 'contact',
        data: {
          fullName: '',
          email: '',
          phone: '',
          location: '',
        },
      },
    },
    {
      id: generateId(),
      order: 1,
      visible: true,
      content: {
        type: 'summary',
        data: { text: '' },
      },
    },
    {
      id: generateId(),
      order: 2,
      visible: true,
      content: {
        type: 'experience',
        data: { items: [] },
      },
    },
    {
      id: generateId(),
      order: 3,
      visible: true,
      content: {
        type: 'education',
        data: { items: [] },
      },
    },
    {
      id: generateId(),
      order: 4,
      visible: true,
      content: {
        type: 'skills',
        data: { categories: [] },
      },
    },
    {
      id: generateId(),
      order: 5,
      visible: true,
      content: {
        type: 'certifications',
        data: { items: [] },
      },
    },
  ];
}

export function createDefaultResume(): Resume {
  return {
    id: generateId(),
    name: 'Master Resume',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    templateId: 'classic',
    sections: createDefaultSections(),
  };
}
