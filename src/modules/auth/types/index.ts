export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export interface AuthSession {
  userId: string;
  sessionId: string;
  isAuthenticated: boolean;
}