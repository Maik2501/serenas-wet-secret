export type CryIntensity = 1 | 2 | 3 | 4;

export const CRY_INTENSITY_LABELS: Record<CryIntensity, string> = {
  1: 'Single tear',
  2: 'Streaming tears',
  3: 'Ugly crying',
  4: 'Mental breakdown',
};

export const CRY_INTENSITY_EMOJIS: Record<CryIntensity, string> = {
  1: '🥲',
  2: '😢',
  3: '😭',
  4: '💔',
};

export interface JournalEntry {
  id: string;
  content: string;
  createdAt: number;
  wasCrying: boolean;
  intensity?: CryIntensity;
}

export interface CryingDay {
  date: string;
  timestamp: number;
  count: number;
}
