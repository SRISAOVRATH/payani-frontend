import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

const AUTH_DURATION = 7 * 24 * 60 * 60 * 1000;
const VERIFIED_AT_KEY = "payani_auth_verified_at";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error);
      }

      if (!mounted) return;

      const currentSession = data?.session || null;
      const verifiedAt = Number(
        localStorage.getItem(VERIFIED_AT_KEY) || 0
      );

      if (
        currentSession &&
        verifiedAt &&
        Date.now() - verifiedAt >= AUTH_DURATION
      ) {
        await supabase.auth.signOut();
        localStorage.removeItem(VERIFIED_AT_KEY);
        setSession(null);
        setUser(null);
      } else {
        setSession(currentSession);
        setUser(currentSession?.user || null);
      }

      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithPhone(phone, name) {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      throw error;
    }
  }

  async function verifyOtp(phone, token, name) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) {
      throw error;
    }

    if (data?.user) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name,
        },
      });

      if (updateError) {
        console.error("Profile update error:", updateError);
      }
    }

    localStorage.setItem(VERIFIED_AT_KEY, String(Date.now()));

    setSession(data?.session || null);
    setUser(data?.user || null);

    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem(VERIFIED_AT_KEY);
    setSession(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithPhone,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}