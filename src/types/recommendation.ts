export type RecommendationStatus = 'pending' | 'accepted' | 'dismissed' | 'executing';
export type RecommendationCategory = 'content' | 'metrics' | 'structure' | 'missing' | 'keyword';

export interface RecommendationMutation {
  tool: string;
  input: Record<string, unknown>;
}

export interface Recommendation {
  id: string;
  text: string;
  prompt: string;
  preview?: string;
  mutation?: RecommendationMutation;
  category: RecommendationCategory;
  priority: 'high' | 'medium' | 'low';
  status: RecommendationStatus;
  sectionId?: string;
  relatedKeywords?: string[];
}
