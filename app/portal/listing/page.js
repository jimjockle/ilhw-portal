"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { MapPin, Phone, Clock, Globe, Image, X, CheckCircle, Save, Edit3, Upload, Tag } from "lucide-react";

export default function ListingPage() {
  const { business, supabase, refreshBusiness } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", phone: "", website: "", hours: "", description: "", keywords: [],
  });
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || "",
        address: business.address || "",
        phone: business.phone || "",
        website: business.website || "",
        hours: business.hours || "",
        description: business.description || "",
        keywords: business.keywords || [],
      });
    }
  }, [business]);

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: form.name,
        address: form.address,
        phone: form.phone,
        website: form.website,
        hours: form.hours,
        description: form.description,
        keywords: form.keywords,
      })
      .eq("id", business.id);

    if (!error) {
      await refreshBusiness();
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !form.keywords.includes(newKeyword.trim())) {
      setForm({ ...form, keywords: [...form.keywords, newKeyword.trim()] });
      setNewKeyword("");
    }
  };

  const removeKeyword = (kw) => {
    setForm({ ...form, keywords: form.keywords.filter(k => k !== kw) });
  };

  if (!business) return (
    <div className="text-center py-16 text-gray-400">
      <p>No business claimed yet.</p>
      <a href="/portal/claim" className="text-brand-blue font-semibold hover:underline">Claim your business →</a>
    </div>
  );

  const fields = [
    { key: "address", icon: MapPin, label: "Address" },
    { key: "phone", icon: Phone, label: "Phone" },
    { key: "hours", icon: Clock, label: "Hours" },
    { key: "website", icon: Globe, label: "Website" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listing Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Control how your business appears in I Live Here Westchester</p>
        </div>
        <div className="flex items-center gap-3">
          {business.verified && (
            <div className="flex items-center gap-1.5 bg-brand-light-green text-brand-green px-3 py-1.5 rounded-lg text-sm font-semibold">
              <CheckCircle size={14} /> Verified
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-1.5 bg-brand-light-green text-brand-green px-3 py-1.5 rounded-lg text-sm font-semibold animate-pulse">
              <CheckCircle size={14} /> Saved!
            </div>
          )}
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 transition disabled:opacity-50 flex items-center gap-2">
                <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 transition flex items-center gap-2">
              <Edit3 size={14} /> Edit Listing
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main content */}
        <div className="col-span-2 space-y-5">
          {/* Core Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Core Information</h2>

            {/* Business name */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Business Name</label>
              {editing ? (
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-brand-blue bg-white text-sm focus:outline-none"
                />
              ) : (
                <div className="text-lg font-bold text-gray-900">{form.name}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {fields.map(({ key, icon: Icon, label }) => (
                <div key={key} className={`rounded-lg p-3 ${editing ? "bg-white border-2 border-brand-blue" : "bg-gray-50 border border-transparent"}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={13} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500">{label}</span>
                  </div>
                  {editing ? (
                    <input
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full text-sm text-gray-900 bg-transparent focus:outline-none"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{form[key] || "Not set"}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-2">Business Description</h2>
            <p className="text-xs text-gray-400 mb-3">
              This is what the chatbot uses when describing your business to users. Make it count.
            </p>
            {editing ? (
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border-2 border-brand-blue text-sm text-gray-700 leading-relaxed focus:outline-none resize-none"
                placeholder="Describe your business in your own words..."
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                {form.description || "No description set. Edit your listing to add one."}
              </div>
            )}
          </div>

          {/* Keywords */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-2">Categories & Keywords</h2>
            <p className="text-xs text-gray-400 mb-3">
              These help the chatbot match your business to relevant queries
            </p>
            <div className="flex flex-wrap gap-2">
              {form.keywords.map((kw, i) => (
                <span key={i} className="bg-brand-light-blue text-brand-blue px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <Tag size={12} />
                  {kw}
                  {editing && (
                    <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => removeKeyword(kw)} />
                  )}
                </span>
              ))}
              {editing && (
                <div className="flex items-center gap-1">
                  <input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                    placeholder="Add keyword..."
                    className="px-3 py-1.5 rounded-full text-sm border border-dashed border-gray-300 bg-gray-50 focus:outline-none focus:border-brand-blue w-32"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Photos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Photos</h2>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  <Image size={20} className="text-gray-300" />
                </div>
              ))}
            </div>
            {editing && (
              <button className="w-full mt-3 py-2.5 rounded-lg border border-dashed border-brand-blue bg-brand-light-blue text-brand-blue text-sm font-semibold hover:bg-brand-blue/10 transition flex items-center justify-center gap-2">
                <Upload size={14} /> Upload Photos
              </button>
            )}
            {business.tier === "free" && !editing && (
              <p className="text-xs text-gray-400 mt-3 text-center">Upgrade to Business ($29/mo) to upload photos</p>
            )}
          </div>

          {/* Quick stats placeholder */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Chatbot appearances</span>
                <span className="text-sm font-bold text-gray-900">—</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">This month's queries</span>
                <span className="text-sm font-bold text-gray-900">—</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Category rank</span>
                <span className="text-sm font-bold text-gray-900">—</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Stats will populate as users interact with the chatbot</p>
          </div>

          {/* Verified badge card */}
          {business.verified && (
            <div className="bg-brand-light-gold rounded-xl p-5 border border-brand-gold/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-brand-gold" />
                <span className="text-sm font-bold text-gray-900">Verified Badge</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your listing displays the I Live Here verified badge, signaling trust and authenticity to the community.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
