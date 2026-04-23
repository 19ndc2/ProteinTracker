export interface ProteinEstimate {
  foodDescription: string;
  proteinGrams: number;
  confirmationText: string;
}

export interface ConfirmResponse {
  totalProteinGramsToday: number;
  acknowledgementText: string;
}

export interface FoodEntry {
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
