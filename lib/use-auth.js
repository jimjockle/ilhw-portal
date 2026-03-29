"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase-browser";

const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (!mounted) return;

        if (sessionErr || !session) {
          router.push("/");
          return;
        }
        setUser(session.user);

        // Load their claim and business
        const { data: claims, error: claimErr } = await supabase
          .from("claims")
          .select("*, businesses(*)")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!mounted) return;

        if (claimErr) {
          setError("Failed to load business data");
          console.error("Claims load error:", claimErr);
        } else if (claims && claims.length > 0) {
          setClaim(claims[0]);
          setBusiness(claims[0].businesses);
        }
      } catch (err) {
        if (mounted) setError("Connection error");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setBusiness(null);
        setClaim(null);
        router.push("/");
      } else if (event === "TOKEN_REFRESHED" && session) {
        setUser(session.user);
      }
    });

    // Periodic session check (every 5 min)
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && mounted) {
        setUser(null);
        router.push("/");
      }
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [router]);

  const refreshBusiness = useCallback(async () => {
    if (!business) return;
    const { data, error: refreshErr } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business.id)
      .single();
    if (refreshErr) {
      setError("Failed to refresh business data");
    } else if (data) {
      setBusiness(data);
    }
  }, [business]);

  return { user, business, claim, loading, error, signOut, supabase, refreshBusiness };
}
