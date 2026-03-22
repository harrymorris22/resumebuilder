export interface ToolCallResult {
  toolName: string;
  input: Record<string, unknown>;
  result: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ToolCallResult[];
}

export interface ChatSession {
  id: string;
  resumeId: string;
  messages: ChatMessage[];
  mode: 'general' | 'job-customisation';
  jobDescriptionId?: string;
}

export interface BankItemSuggestion {
  bankItemId: string;
  reason: string;
  targetSection?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface StarSuggestion {
  originalText: string;
  starText: string;
  sectionId?: string;
  itemId?: string;
  bulletIndex?: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export type ActionStatus = 'pending' | 'executing' | 'completed' | 'dismissed';
export type ActionCategory = 'content' | 'metrics' | 'structure' | 'missing' | 'question';
export type ActionPriority = 'high' | 'medium' | 'low';

export interface ActionSuggestion {
  id: string;
  text: string;
  prompt: string;
  preview?: string;
  sectionId?: string;
  category: ActionCategory;
  priority: ActionPriority;
  status: ActionStatus;
}
