import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Resume } from '../types/resume';
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
  saveCoverLetter,
} from '../db/indexedDb';
import { createDefaultResume } from '../utils/resumeDefaults';
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

  // Actions — chat
  setActiveChatSessionId: (id: string | null) => void;
  addChatSession: (session: ChatSession) => void;
  updateChatSession: (session: ChatSession) => void;

  // Actions — content bank
  addContentBankItem: (item: ContentBankItem) => void;
  removeContentBankItem: (id: string) => void;
  updateContentBankItem: (item: ContentBankItem) => void;

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
        set((s) => ({
          resumes: s.resumes.filter((r) => r.id !== id),
          activeResumeId: s.activeResumeId === id ? null : s.activeResumeId,
        }));
        deleteResumeFromDb(id);
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
        const [resumes, chatSessions, contentBankItems] = await Promise.all([
          getAllResumes(),
          getAllChatSessions(),
          getAllContentBankItems(),
        ]);

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
