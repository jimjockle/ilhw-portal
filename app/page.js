"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Shield, ArrowRight, CheckCircle, BarChart3, Mail, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/portal/dashboard");
      else setChecking(false);
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (!error) setSent(true);
    setLoading(false);
  };

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-brand-navy to-brand-blue">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between">
        <div>
          <div className="text-white text-xl font-extrabold tracking-tight">I LIVE HERE</div>
          <div className="text-brand-gold text-xs font-semibold tracking-widest">WESTCHESTER</div>
        </div>
        <a href="https://ilhw-chatbot.vercel.app" target="_blank" className="text-white/60 text-sm hover:text-white transition">
          Try the Chatbot →
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: value prop */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Take control of how<br />your business appears
            </h1>
            <p className="text-white/70 text-lg mb-10 leading-relaxed">
              I Live Here Westchester is how your community finds local businesses.
              Claim your listing, manage your presence, and see exactly what the chatbot
              tells people about you.
            </p>

            <div className="space-y-5">
              {[
                { icon: Shield, text: "Claim and verify your business in under 3 minutes" },
                { icon: CheckCircle, text: "Control your description, photos, hours, and keywords" },
                { icon: BarChart3, text: "See how people search for businesses like yours" },
                { icon: Zap, text: "Publish events and promotions the chatbot will surface" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-brand-gold" />
                  </div>
                  <span className="text-white/80 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: login */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-brand-light-green flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-brand-green" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                <p className="text-gray-500 mb-6">
                  We sent a magic link to <strong>{email}</strong>. Click it to sign in.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-brand-blue text-sm font-semibold hover:underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Portal</h2>
                <p className="text-gray-500 text-sm mb-8">Sign in to manage your listing or claim your business</p>

                <form onSubmit={handleLogin}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 mb-4"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-blue text-white py-3 rounded-lg font-semibold text-sm hover:bg-brand-blue/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Sending..." : "Sign in with Magic Link"}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    No password needed. We'll send a secure link to your email.
                    <br />
                    First time? You'll be guided through the claim process.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
