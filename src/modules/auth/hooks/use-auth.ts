import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";

export function useAuth() {
  const { isLoaded, userId, sessionId, signOut } = useClerkAuth();
  const { user, isLoaded: userLoaded } = useUser();

  return {
    isLoaded: isLoaded && userLoaded,
    isAuthenticated: !!userId,
    userId,
    sessionId,
    user,
    signOut,
  };
}