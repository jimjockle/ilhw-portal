import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value; },
          set(name, value, options) { cookieStore.set({ name, value, ...options }); },
          remove(name, options) { cookieStore.set({ name, value: "", ...options }); },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user has a claimed business
      const { data: { user } } = await supabase.auth.getUser();
      const { data: claims } = await supabase.from("claims")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "verified")
        .limit(1);

      if (claims && claims.length > 0) {
        return NextResponse.redirect(`${origin}/portal/dashboard`);
      }
      // No claim yet — send to claim flow
      return NextResponse.redirect(`${origin}/portal/claim`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
