export interface JournalEntry {
  id: string;
  content: string;
  createdAt: number;
  wasCrying: boolean;
}

export interface CryingDay {
  date: string;
  timestamp: number;
  count: number;
}
