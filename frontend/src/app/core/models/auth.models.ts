export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  displayName: string;
}

export interface UserResponse {
  userId: string;
  email: string;
  displayName: string;
  dailyGoalGrams: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
}
