// hooks/use-current-user.ts
import { useSession, getSession } from "next-auth/react";

export const useCurrentUser = () => {
  // getSession();
  const session = useSession();

  return {
    user: session.data?.user,
    isLoading: session.status === "loading",
    error: session.status === "unauthenticated" ? new Error("Not authenticated") : null
  };
};