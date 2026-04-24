export interface ProteinEstimate {
  foodDescription: string;
  proteinGrams: number;
  confirmationText: string;
  date?: string | null;
}

export interface ConfirmResponse {
  totalProteinGrams: number;
  date: string;
  acknowledgementText: string;
}

export interface FoodEntry {
  id: string;
  foodDescription: string;
  proteinGrams: number;
  loggedAt: string;
}

export interface DailyLogResponse {
  totalProteinGrams: number;
  entries: FoodEntry[];
}

export interface HistoryDay {
  id: string;
  date: string;
  totalProteinGrams: number;
  entries: FoodEntry[];
}
