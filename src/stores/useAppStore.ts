import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Resume, ContentPoolEntry, ContentPoolItemData } from '../types/resume';
import type { ContentBankItem, CoverLetter } from '../types/resume';
import type { ChatSession } from '../types/chat';
import {
  saveResume,
  getAllResumes,
  deleteResume as deleteResumeFromDb,
  saveChatSession,
  getAllChatSessions,
  saveContentBankItem,
  getAllContentBankItems,
  deleteContentBankItem as deleteContentBankItemFromDb,
  saveContentPoolEntry,
  getAllContentPoolEntries,
  deleteContentPoolEntry as deletePoolEntryFromDb,
  saveCoverLetter,
} from '../db/indexedDb';
import { createDefaultResume, cloneResume } from '../utils/resumeDefaults';
import { generateId } from '../utils/id';

interface AppState {
  // Persisted scalars (localStorage)
  apiKey: string;
  darkMode: boolean;
  activeResumeId: string | null;
  activeChatSessionId: string | null;
  leftPanelWidth: number;

  // In-memory state (hydrated from IDB)
  resumes: Resume[];
  chatSessions: ChatSession[];
  contentBankItems: ContentBankItem[];
  contentPool: ContentPoolEntry[];
  coverLetters: CoverLetter[];
  hydrated: boolean;
  settingsOpen: boolean;
  atsKeywords: string[];
  activeCoverLetter: CoverLetter | null;
  pendingAutoMessage: string | null;
  latestCoachSuggestion: { text: string; prompt: string } | null;

  // Actions — settings
  setApiKey: (key: string) => void;
  toggleDarkMode: () => void;
  setLeftPanelWidth: (width: number) => void;
  setSettingsOpen: (open: boolean) => void;

  // Actions — resumes
  setActiveResumeId: (id: string | null) => void;
  addResume: (resume: Resume) => void;
  updateResume: (resume: Resume) => void;
  removeResume: (id: string) => void;
  duplicateResume: (id: string) => void;
  renameResume: (id: string, name: string) => void;

  // Actions — chat
  setActiveChatSessionId: (id: string | null) => void;
  addChatSession: (session: ChatSession) => void;
  updateChatSession: (session: ChatSession) => void;

  // Actions — content bank (legacy)
  addContentBankItem: (item: ContentBankItem) => void;
  removeContentBankItem: (id: string) => void;
  updateContentBankItem: (item: ContentBankItem) => void;

  // Actions — content pool
  addPoolEntry: (entry: ContentPoolEntry) => void;
  removePoolEntry: (id: string) => void;
  updatePoolEntry: (entry: ContentPoolEntry) => void;
  reorderPoolEntries: (orderedIds: string[]) => void;
  addPoolItemToResume: (poolEntryId: string, resumeId: string) => void;
  removePoolItemFromResume: (poolEntryId: string, resumeId: string) => void;

  // Actions — cover letters
  addCoverLetter: (letter: CoverLetter) => void;
  setActiveCoverLetter: (letter: CoverLetter | null) => void;

  // Actions — ATS
  setAtsKeywords: (keywords: string[]) => void;

  // Actions — auto-message & coach
  setPendingAutoMessage: (msg: string | null) => void;
  setLatestCoachSuggestion: (s: { text: string; prompt: string } | null) => void;

  // Hydration
  hydrateFromIdb: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Persisted scalars
      apiKey: '',
      darkMode: false,
      activeResumeId: null,
      activeChatSessionId: null,
      leftPanelWidth: 40,

      // In-memory
      resumes: [],
      chatSessions: [],
      contentBankItems: [],
      contentPool: [],
      coverLetters: [],
      hydrated: false,
      atsKeywords: [],
      activeCoverLetter: null,
      pendingAutoMessage: null,
      latestCoachSuggestion: null,
      settingsOpen: false,

      // Settings
      setApiKey: (key) => set({ apiKey: key }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),

      // Resumes
      setActiveResumeId: (id) => set({ activeResumeId: id }),

      addResume: (resume) => {
        set((s) => ({ resumes: [...s.resumes, resume] }));
        saveResume(resume);
      },

      updateResume: (resume) => {
        set((s) => ({
          resumes: s.resumes.map((r) => (r.id === resume.id ? resume : r)),
        }));
        saveResume(resume);
      },

      removeResume: (id) => {
        const { resumes } = get();
        if (resumes.length <= 1) return; // prevent deleting last resume
        const remaining = resumes.filter((r) => r.id !== id);
        set((s) => ({
          resumes: remaining,
          activeResumeId: s.activeResumeId === id ? remaining[0]?.id ?? null : s.activeResumeId,
        }));
        deleteResumeFromDb(id);
      },

      duplicateResume: (id) => {
        const source = get().resumes.find((r) => r.id === id);
        if (!source) return;
        const clone = cloneResume(source);
        set((s) => ({ resumes: [...s.resumes, clone], activeResumeId: clone.id }));
        saveResume(clone);
      },

      renameResume: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === id ? { ...r, name: trimmed, updatedAt: new Date().toISOString() } : r
          ),
        }));
        const updated = get().resumes.find((r) => r.id === id);
        if (updated) saveResume(updated);
      },

      // Chat
      setActiveChatSessionId: (id) => set({ activeChatSessionId: id }),

      addChatSession: (session) => {
        set((s) => ({ chatSessions: [...s.chatSessions, session] }));
        saveChatSession(session);
      },

      updateChatSession: (session) => {
        set((s) => ({
          chatSessions: s.chatSessions.map((c) =>
            c.id === session.id ? session : c
          ),
        }));
        saveChatSession(session);
      },

      // Content bank
      addContentBankItem: (item) => {
        set((s) => ({ contentBankItems: [...s.contentBankItems, item] }));
        saveContentBankItem(item);
      },

      removeContentBankItem: (id) => {
        set((s) => ({
          contentBankItems: s.contentBankItems.filter((i) => i.id !== id),
        }));
        deleteContentBankItemFromDb(id);
      },

      updateContentBankItem: (item) => {
        set((s) => ({
          contentBankItems: s.contentBankItems.map((i) =>
            i.id === item.id ? item : i
          ),
        }));
        saveContentBankItem(item);
      },

      // Content pool
      addPoolEntry: (entry) => {
        set((s) => ({ contentPool: [...s.contentPool, entry] }));
        saveContentPoolEntry(entry);
      },

      removePoolEntry: (id) => {
        set((s) => ({ contentPool: s.contentPool.filter((e) => e.id !== id) }));
        deletePoolEntryFromDb(id);
      },

      updatePoolEntry: (entry) => {
        set((s) => ({
          contentPool: s.contentPool.map((e) => (e.id === entry.id ? entry : e)),
        }));
        saveContentPoolEntry(entry);
      },

      reorderPoolEntries: (orderedIds) => {
        set((s) => {
          const idToEntry = new Map(s.contentPool.map((e) => [e.id, e]));
          const reordered: ContentPoolEntry[] = [];
          for (const id of orderedIds) {
            const entry = idToEntry.get(id);
            if (entry) {
              reordered.push(entry);
              idToEntry.delete(id);
            }
          }
          // Append any entries not in orderedIds (shouldn't happen, but defensive)
          for (const entry of idToEntry.values()) {
            reordered.push(entry);
          }
          return { contentPool: reordered };
        });
      },

      addPoolItemToResume: (poolEntryId, resumeId) => {
        const pool = get().contentPool;
        const entry = pool.find((e) => e.id === poolEntryId);
        if (!entry) return;

        const resume = get().resumes.find((r) => r.id === resumeId);
        if (!resume) return;

        const itemData = entry.item as ContentPoolItemData;
        const clonedData = structuredClone(itemData.data);

        // Assign new ID to cloned item if it has one
        if ('id' in clonedData) {
          (clonedData as { id: string }).id = generateId();
        }

        // Map pool item type → resume section type
        const poolType = itemData.type;
        const sectionTypeMap: Record<string, string> = {
          contact: 'contact', summary: 'summary', bullet: 'experience',
          education: 'education', skill_category: 'skills', project: 'projects', certification: 'certifications',
        };
        const sectionType = sectionTypeMap[poolType] || poolType;
        const updatedSections = [...resume.sections];
        let section = updatedSections.find((s) => s.content.type === sectionType);

        if (!section) {
          section = {
            id: generateId(),
            order: updatedSections.length,
            visible: true,
            content: { type: sectionType, data: {} } as never,
          };
          updatedSections.push(section);
        }

        // Add the item to the section
        const sectionData = { ...section.content.data } as Record<string, unknown>;
        if (sectionType === 'contact' || sectionType === 'summary') {
          section = { ...section, content: { type: sectionType, data: clonedData } as never };
          const idx = updatedSections.findIndex((s) => s.id === section!.id);
          if (idx >= 0) updatedSections[idx] = section;
        } else if (sectionType === 'skills') {
          const cats = ((sectionData.categories as unknown[]) || []) as unknown[];
          cats.push(clonedData);
          section = { ...section, content: { type: 'skills', data: { categories: cats } } as never };
          const idx = updatedSections.findIndex((s) => s.id === section!.id);
          if (idx >= 0) updatedSections[idx] = section;
        } else if (poolType === 'bullet') {
          // Bullets get added to the matching experience entry's bullets array
          // For now, add as a new experience entry with just this bullet
          const bulletText = (clonedData as { text: string }).text;
          const ctx = (itemData as { context: { company: string; title: string; location: string; startDate: string; endDate: string | null } }).context;
          // Clone items array to avoid mutating store state directly
          const expItems = ((sectionData.items as Array<{ company: string; title: string; bullets: string[]; [key: string]: unknown }>) || []).map((item) => ({ ...item, bullets: [...item.bullets] }));
          const existing = expItems.find((e) => e.company === ctx.company && e.title === ctx.title);
          if (existing) {
            // Deduplicate: only add if not already present
            if (!existing.bullets.includes(bulletText)) {
              existing.bullets.push(bulletText);
            }
          } else {
            expItems.push({ company: ctx.company, title: ctx.title, id: generateId(), location: ctx.location, dateRange: { start: ctx.startDate, end: ctx.endDate }, bullets: [bulletText] } as never);
          }
          // Sort experience items: current jobs first, then by start date descending
          const parseJobDate = (d: string): number => {
            if (!d) return 0;
            const t = Date.parse(d);
            if (!isNaN(t)) return t;
            const t2 = Date.parse(`1 ${d}`);
            if (!isNaN(t2)) return t2;
            const year = parseInt(d, 10);
            if (!isNaN(year)) return new Date(year, 0).getTime();
            return 0;
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expItems.sort((a: any, b: any) => {
            const aEnd = a.dateRange?.end;
            const bEnd = b.dateRange?.end;
            const aIsCurrent = !aEnd || aEnd === 'Present';
            const bIsCurrent = !bEnd || bEnd === 'Present';
            if (aIsCurrent && !bIsCurrent) return -1;
            if (!aIsCurrent && bIsCurrent) return 1;
            return parseJobDate(b.dateRange?.start || '') - parseJobDate(a.dateRange?.start || '');
          });
          section = { ...section, content: { type: 'experience', data: { items: expItems } } as never };
          const idx = updatedSections.findIndex((s) => s.id === section!.id);
          if (idx >= 0) updatedSections[idx] = section;
        } else {
          const items = ((sectionData.items as unknown[]) || []) as unknown[];
          items.push(clonedData);
          section = { ...section, content: { type: sectionType, data: { items } } as never };
          const idx = updatedSections.findIndex((s) => s.id === section!.id);
          if (idx >= 0) updatedSections[idx] = section;
        }

        const updated = { ...resume, sections: updatedSections, updatedAt: new Date().toISOString() };
        get().updateResume(updated);
      },

      removePoolItemFromResume: (poolEntryId, resumeId) => {
        const pool = get().contentPool;
        const entry = pool.find((e) => e.id === poolEntryId);
        if (!entry) return;

        const resume = get().resumes.find((r) => r.id === resumeId);
        if (!resume) return;

        const poolType = entry.item.type;
        const sectionTypeMap: Record<string, string> = {
          contact: 'contact', summary: 'summary', bullet: 'experience',
          education: 'education', skill_category: 'skills', project: 'projects', certification: 'certifications',
        };
        const sectionType = sectionTypeMap[poolType] || poolType;
        const section = resume.sections.find((s) => s.content.type === sectionType);
        if (!section) return;

        const updatedSections = resume.sections.map((s) => {
          if (s.id !== section.id) return s;
          const data = s.content.data as Record<string, unknown>;

          if (poolType === 'contact') {
            return { ...s, content: { type: 'contact' as const, data: { fullName: '', email: '', phone: '', location: '' } } };
          }
          if (poolType === 'summary') {
            return { ...s, content: { type: 'summary' as const, data: { text: '' } } };
          }
          if (poolType === 'skill_category') {
            const entryData = entry.item.data as { name: string };
            const skillsData = data as { categories?: Array<{ id: string; name: string; skills: string[] }> };
            const cats = (skillsData.categories || []).filter((c) => c.name !== entryData.name);
            return { ...s, content: { type: 'skills' as const, data: { categories: cats } } };
          }
          if (poolType === 'bullet') {
            // Remove the specific bullet text from the matching experience entry
            const bulletText = (entry.item.data as { text: string }).text;
            const ctx = (entry.item as { context: { company: string; title: string } }).context;
            // Clone items to avoid mutating store state directly
            const expItems = ((data.items as Array<{ company: string; title: string; bullets: string[]; [key: string]: unknown }>) || []).map((item) => {
              if (item.company !== ctx.company || item.title !== ctx.title) return item;
              return { ...item, bullets: item.bullets.filter((b) => b !== bulletText) };
            });
            return { ...s, content: { type: 'experience' as const, data: { items: expItems } } as never };
          }

          // For education, projects, certifications — remove last item
          const items = ((data.items as unknown[]) || []) as unknown[];
          if (items.length > 0) items.pop();
          return { ...s, content: { type: sectionType, data: { items } } as never };
        });

        const updated = { ...resume, sections: updatedSections, updatedAt: new Date().toISOString() };
        get().updateResume(updated);
      },

      // Cover letters
      addCoverLetter: (letter) => {
        set((s) => ({ coverLetters: [...s.coverLetters, letter] }));
        saveCoverLetter(letter);
      },
      setActiveCoverLetter: (letter) => set({ activeCoverLetter: letter }),

      // ATS
      setAtsKeywords: (keywords) => set({ atsKeywords: keywords }),

      // Auto-message & coach
      setPendingAutoMessage: (msg) => set({ pendingAutoMessage: msg }),
      setLatestCoachSuggestion: (s) => set({ latestCoachSuggestion: s }),

      // Hydration
      hydrateFromIdb: async () => {
        const [resumes, chatSessions, contentBankItems, contentPool] = await Promise.all([
          getAllResumes(),
          getAllChatSessions(),
          getAllContentBankItems(),
          getAllContentPoolEntries(),
        ]);

        // Deduplicate experience bullets (repair any data corrupted by prior bug)
        for (const resume of resumes) {
          for (const section of resume.sections) {
            if (section.content.type !== 'experience') continue;
            const expData = section.content.data as { items?: Array<{ bullets: string[] }> };
            if (!expData.items) continue;
            let dirty = false;
            for (const job of expData.items) {
              const deduped = [...new Set(job.bullets)];
              if (deduped.length !== job.bullets.length) {
                job.bullets = deduped;
                dirty = true;
              }
            }
            if (dirty) saveResume(resume);
          }
        }

        // Create default master resume if none exist
        if (resumes.length === 0) {
          const defaultResume = createDefaultResume();
          await saveResume(defaultResume);
          resumes.push(defaultResume);
        }

        const state = get();
        const activeResumeId = state.activeResumeId ?? resumes[0]?.id ?? null;
        set({
          resumes,
          chatSessions,
          contentBankItems,
          contentPool,
          hydrated: true,
          activeResumeId,
        });

        // Restore or create a chat session for the active resume
        if (activeResumeId) {
          const sessionsForResume = chatSessions.filter(
            (s) => s.resumeId === activeResumeId
          );

          if (sessionsForResume.length === 0) {
            // No sessions exist for this resume — create a default one
            const newSession: ChatSession = {
              id: generateId(),
              resumeId: activeResumeId,
              messages: [],
              mode: 'general',
            };
            get().addChatSession(newSession);
            set({ activeChatSessionId: newSession.id });
          } else {
            // Sessions exist — restore the active one, or pick the first match
            const savedId = state.activeChatSessionId;
            const validSession = sessionsForResume.find(
              (s) => s.id === savedId
            );
            set({
              activeChatSessionId: validSession
                ? validSession.id
                : sessionsForResume[0].id,
            });
          }
        }
      },
    }),
    {
      name: 'resume-builder-settings',
      partialize: (state) => ({
        apiKey: state.apiKey,
        darkMode: state.darkMode,
        activeResumeId: state.activeResumeId,
        activeChatSessionId: state.activeChatSessionId,
        leftPanelWidth: state.leftPanelWidth,
      }),
    }
  )
);
