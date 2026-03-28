"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { Search, Shield, CheckCircle, ArrowRight, MapPin, Phone, Clock, Globe, Mail, Building2 } from "lucide-react";

export default function ClaimPage() {
  const { user, business, supabase } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: search, 2: confirm, 3: verify, 4: done
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [verifyMethod, setVerifyMethod] = useState("email");
  const [verifying, setVerifying] = useState(false);

  // If already claimed, redirect
  useEffect(() => {
    if (business?.claimed) router.push("/portal/dashboard");
  }, [business]);

  // Search businesses from dataset
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const datasetUrl = process.env.NEXT_PUBLIC_DATASET_URL || "https://ilhw-chatbot.vercel.app/dataset.json";
      const res = await fetch(datasetUrl);
      const data = await res.json();
      const q = searchQuery.toLowerCase();
      const matches = (data.businesses || [])
        .filter(b => b.name.toLowerCase().includes(q) || (b.address || "").toLowerCase().includes(q))
        .slice(0, 10);
      setResults(matches);
    } catch (err) {
      console.error("Search failed:", err);
    }
    setSearching(false);
  };

  // Claim the selected business
  const handleClaim = async () => {
    if (!selected || !user) return;
    setVerifying(true);

    // Upsert the business into Supabase
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .upsert({
        dataset_id: selected.name,
        name: selected.name,
        address: selected.address || "",
        town: selected.town || "",
        phone: selected.phone || "",
        website: selected.website || "",
        hours: selected.hours || "",
        description: selected.description || "",
        subcategory: selected.subcategory || "",
        keywords: Array.isArray(selected.keywords) ? selected.keywords : [],
        claimed: true,
        claimed_at: new Date().toISOString(),
        verified: true, // auto-verify for MVP
        verified_at: new Date().toISOString(),
        tier: "free",
      }, { onConflict: "dataset_id" })
      .select()
      .single();

    if (bizErr) {
      console.error("Claim failed:", bizErr);
      setVerifying(false);
      return;
    }

    // Create the claim record
    await supabase.from("claims").insert({
      business_id: biz.id,
      user_id: user.id,
      status: "verified",
      verification_method: verifyMethod,
      verified_at: new Date().toISOString(),
    });

    setStep(4);
    setVerifying(false);

    // Redirect after celebration
    setTimeout(() => router.push("/portal/listing"), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
              step >= s ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-400"
            }`}>{step > s ? "✓" : s}</div>
            <span className={`text-xs font-medium ${step >= s ? "text-gray-900" : "text-gray-400"}`}>
              {s === 1 ? "Find" : s === 2 ? "Confirm" : "Verify"}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-brand-blue" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Search */}
      {step === 1 && (
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-brand-light-blue flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-brand-blue" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Your Business</h1>
            <p className="text-gray-500 text-sm">Search for your business in our directory to get started</p>
          </div>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by business name or address..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-6 py-3 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:bg-brand-blue/90 transition disabled:opacity-50"
            >
              {searching ? "..." : "Search"}
            </button>
          </div>

          {results.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {results.map((biz, i) => (
                <div
                  key={i}
                  onClick={() => { setSelected(biz); setStep(2); }}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-light-blue flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-brand-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{biz.name}</div>
                    <div className="text-xs text-gray-500">{biz.address || biz.town}</div>
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{biz.subcategory || "Business"}</div>
                  <ArrowRight size={16} className="text-gray-300" />
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && searchQuery && !searching && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No businesses found. Try a different search term.
            </div>
          )}
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && selected && (
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-brand-light-blue flex items-center justify-center mx-auto mb-4">
              <Shield size={28} className="text-brand-blue" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Business</h1>
            <p className="text-gray-500 text-sm">Make sure this is the right listing before claiming</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{selected.name}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: MapPin, label: "Address", value: selected.address || "Not listed" },
                { icon: Phone, label: "Phone", value: selected.phone || "Not listed" },
                { icon: Clock, label: "Hours", value: selected.hours || "Not listed" },
                { icon: Globe, label: "Website", value: selected.website || "Not listed" },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500">{label}</span>
                  </div>
                  <div className="text-sm text-gray-900 truncate">{value}</div>
                </div>
              ))}
            </div>
            {selected.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-500 mb-2">Current Description</div>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setSelected(null); }}
              className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Not my business
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 transition flex items-center justify-center gap-2"
            >
              This is my business <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Verify */}
      {step === 3 && selected && (
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-brand-light-green flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-brand-green" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Ownership</h1>
            <p className="text-gray-500 text-sm">Choose how you'd like to verify you own {selected.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div
              onClick={() => setVerifyMethod("email")}
              className={`p-5 rounded-xl border-2 text-center cursor-pointer transition ${
                verifyMethod === "email" ? "border-brand-blue bg-brand-light-blue" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Mail size={28} className={verifyMethod === "email" ? "text-brand-blue" : "text-gray-400"} style={{ margin: "0 auto 8px" }} />
              <div className={`text-sm font-semibold ${verifyMethod === "email" ? "text-brand-blue" : "text-gray-700"}`}>Email Verification</div>
              <div className="text-xs text-gray-500 mt-1">We'll send a code to your business email</div>
            </div>
            <div
              onClick={() => setVerifyMethod("phone")}
              className={`p-5 rounded-xl border-2 text-center cursor-pointer transition ${
                verifyMethod === "phone" ? "border-brand-blue bg-brand-light-blue" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Phone size={28} className={verifyMethod === "phone" ? "text-brand-blue" : "text-gray-400"} style={{ margin: "0 auto 8px" }} />
              <div className={`text-sm font-semibold ${verifyMethod === "phone" ? "text-brand-blue" : "text-gray-700"}`}>Phone Verification</div>
              <div className="text-xs text-gray-500 mt-1">We'll call your listed number</div>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={verifying}
            className="w-full py-3.5 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {verifying ? "Verifying..." : "Verify & Claim My Business"}
            {!verifying && <ArrowRight size={16} />}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Takes less than 3 minutes. You'll receive your verified badge immediately.
          </p>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-brand-light-green flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle size={40} className="text-brand-green" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">You're Verified!</h1>
          <p className="text-gray-500 mb-2">
            <strong>{selected?.name}</strong> is now claimed and verified.
          </p>
          <p className="text-gray-400 text-sm">Redirecting to your listing manager...</p>
        </div>
      )}
    </div>
  );
}
