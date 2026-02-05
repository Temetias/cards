import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserData } from "../../shared/user.ts";
import type { Nullable } from "../../shared/utils.ts";

type UserContextValue = {
  user: Nullable<UserData>;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: Nullable<UserData>) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Nullable<UserData>>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/me");
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as UserData;
      setUser(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <UserContext.Provider value={{ user, loading, refresh, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within UserProvider");
  }
  return context;
}

export function useUser() {
  const { user, loading } = useUserContext();
  return { user, loading };
}
