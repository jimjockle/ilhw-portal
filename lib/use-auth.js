"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase-browser";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }
      setUser(session.user);

      // Load their claim and business
      const { data: claims } = await supabase
        .from("claims")
        .select("*, businesses(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (claims && claims.length > 0) {
        setClaim(claims[0]);
        setBusiness(claims[0].businesses);
      }
      setLoading(false);
    }
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.push("/");
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const refreshBusiness = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business.id)
      .single();
    if (data) setBusiness(data);
  };

  return { user, business, claim, loading, signOut, supabase, refreshBusiness };
}
