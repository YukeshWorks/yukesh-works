import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useGameAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error("Could not restore Supabase session:", error);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  }, []);

  return { user, loading, signInWithGoogle, signOut };
};
