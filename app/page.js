"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Shield, ArrowRight, CheckCircle, BarChart3, Mail, Zap, Search, MapPin, Phone, Clock, Globe, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const supabase = createClient();

  // Listing preview state
  const [query, setQuery] = useState("");
  const [dataset, setDataset] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/portal/dashboard");
      else setChecking(false);
    });
  }, []);

  // Load dataset for preview search
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_DATASET_URL;
    if (!url) return;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : data.businesses || data.data || [];
        setDataset(items);
        setDatasetLoaded(true);
      })
      .catch(() => {});
  }, []);

  // Search as user types
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setSelectedBiz(null);
      return;
    }
    const q = query.toLowerCase();
    const matches = dataset
      .filter((b) => {
        const name = (b.name || b.business_name || "").toLowerCase();
        const town = (b.town || b.city || "").toLowerCase();
        const cat = (b.subcategory || b.category || "").toLowerCase();
        return name.includes(q) || town.includes(q) || cat.includes(q);
      })
      .slice(0, 6);
    setResults(matches);
    setSelectedBiz(null);
  }, [query, dataset]);

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

  const getBizField = (biz, ...keys) => {
    for (const k of keys) if (biz[k]) return biz[k];
    return null;
  };

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-brand-navy to-brand-blue">
      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/logo-white.png" alt="I Live Here Media" width={44} height={44} className="flex-shrink-0" />
          <div>
            <div className="text-white text-lg font-extrabold tracking-tight leading-none">I LIVE HERE</div>
            <div className="text-brand-gold text-[10px] font-semibold tracking-[3px]">WESTCHESTER</div>
          </div>
        </div>
        <a href="https://ilhw-chatbot.vercel.app" target="_blank" className="text-white/60 text-sm hover:text-white transition">
          Try the Chatbot →
        </a>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-8 pt-12 pb-8">
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
                    No password needed. We&apos;ll send a secure link to your email.
                    <br />
                    First time? You&apos;ll be guided through the claim process.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Listing Preview Section */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-8 lg:p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-3">
              See how your business appears right now
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Search below to preview your listing as Westchester residents see it.
              Don&apos;t like what you see? Claim it and take control.
            </p>
          </div>

          {/* Search input */}
          <div className="max-w-xl mx-auto mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your business name..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/20 transition"
              />
              {datasetLoaded && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">
                  {dataset.length.toLocaleString()} businesses indexed
                </span>
              )}
            </div>
          </div>

          {/* Search results */}
          {results.length > 0 && !selectedBiz && (
            <div className="max-w-xl mx-auto space-y-2">
              {results.map((biz, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedBiz(biz)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 transition text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-blue/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-blue font-bold text-sm">
                      {(getBizField(biz, "name", "business_name") || "?").charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold truncate">
                      {getBizField(biz, "name", "business_name")}
                    </div>
                    <div className="text-white/40 text-xs truncate">
                      {[getBizField(biz, "town", "city"), getBizField(biz, "subcategory", "category")].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Selected business preview */}
          {selectedBiz && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {getBizField(selectedBiz, "name", "business_name")}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getBizField(selectedBiz, "subcategory", "category")}
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelectedBiz(null); setQuery(""); }}
                    className="text-gray-400 text-xs hover:text-gray-600"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {getBizField(selectedBiz, "address", "full_address") && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{getBizField(selectedBiz, "address", "full_address")}</span>
                    </div>
                  )}
                  {getBizField(selectedBiz, "phone", "phone_number") && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{getBizField(selectedBiz, "phone", "phone_number")}</span>
                    </div>
                  )}
                  {getBizField(selectedBiz, "hours", "business_hours") && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{getBizField(selectedBiz, "hours", "business_hours")}</span>
                    </div>
                  )}
                  {getBizField(selectedBiz, "website", "url") && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{getBizField(selectedBiz, "website", "url")}</span>
                    </div>
                  )}
                </div>

                {getBizField(selectedBiz, "description", "about") && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {getBizField(selectedBiz, "description", "about")}
                    </p>
                  </div>
                )}

                {/* Missing info callout */}
                {(() => {
                  const missing = [];
                  if (!getBizField(selectedBiz, "description", "about")) missing.push("description");
                  if (!getBizField(selectedBiz, "phone", "phone_number")) missing.push("phone");
                  if (!getBizField(selectedBiz, "website", "url")) missing.push("website");
                  if (!getBizField(selectedBiz, "hours", "business_hours")) missing.push("hours");
                  if (missing.length === 0) return null;
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-amber-800 font-semibold mb-1">Missing information</p>
                      <p className="text-xs text-amber-700">
                        This listing is missing: {missing.join(", ")}. Claim it to fill in the gaps
                        and control how the chatbot represents your business.
                      </p>
                    </div>
                  );
                })()}

                {/* CTA */}
                <div className="bg-brand-navy rounded-lg p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">Is this your business?</p>
                    <p className="text-white/50 text-xs mt-0.5">Claim it to control your presence on I Live Here Westchester</p>
                  </div>
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      setTimeout(() => document.querySelector('input[type="email"]')?.focus(), 500);
                    }}
                    className="bg-brand-gold text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-gold/90 transition flex-shrink-0"
                  >
                    Claim This Listing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state when typing but no results */}
          {query.length >= 2 && results.length === 0 && datasetLoaded && !selectedBiz && (
            <div className="text-center py-6">
              <p className="text-white/40 text-sm">No businesses found matching &ldquo;{query}&rdquo;</p>
              <p className="text-white/25 text-xs mt-1">Try a different name or town</p>
            </div>
          )}

          {/* Prompt when nothing is typed */}
          {query.length < 2 && !selectedBiz && (
            <div className="flex justify-center gap-3 mt-4 flex-wrap">
              {["Scarsdale", "White Plains", "Tarrytown", "Restaurants", "Fitness"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setQuery(tag); searchRef.current?.focus(); }}
                  className="px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/10 text-white/40 text-xs hover:bg-white/10 hover:text-white/60 transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-8 pb-8">
        <div className="flex items-center justify-between text-white/20 text-xs">
          <span>&copy; {new Date().getFullYear()} I Live Here Media LLC</span>
          <a href="https://ilhw-chatbot.vercel.app" target="_blank" className="hover:text-white/40 transition">
            ilhw-chatbot.vercel.app
          </a>
        </div>
      </footer>
    </div>
  );
}
