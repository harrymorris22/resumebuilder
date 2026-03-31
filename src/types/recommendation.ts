export type RecommendationStatus = 'pending' | 'accepted' | 'dismissed' | 'executing';
export type RecommendationCategory = 'content' | 'metrics' | 'structure' | 'missing' | 'keyword';

export interface Recommendation {
  id: string;
  text: string;
  prompt: string;
  preview?: string;
  category: RecommendationCategory;
  priority: 'high' | 'medium' | 'low';
  status: RecommendationStatus;
  sectionId?: string;
  relatedKeywords?: string[];
}
