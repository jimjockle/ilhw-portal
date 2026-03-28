"use client";
import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { Search, MessageSquare, CheckCircle, Zap, Eye, TrendingUp } from "lucide-react";

export default function PreviewPage() {
  const { business } = useAuth();
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(null);

  const suggestedQueries = business ? [
    `${business.subcategory || "businesses"} in ${business.town}`,
    `best ${(business.keywords || [])[0] || "shop"} near me`,
    `${business.town} recommendations`,
    `things to do in ${business.town}`,
  ] : [];

  const handlePreview = async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim() || !business) return;
    setQuery(searchQuery);
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          businessId: business.dataset_id,
          businessName: business.name,
          businessTown: business.town,
        }),
      });
      const data = await res.json();
      setResponse(data.response);
      setPosition(data.position);
    } catch (err) {
      setResponse("Preview unavailable. Make sure the API is configured.");
    }
    setLoading(false);
  };

  // Calculate a basic visibility score
  const getVisibilityScore = () => {
    let score = 50;
    if (business?.description && business.description.length > 50) score += 15;
    if (business?.keywords?.length > 3) score += 10;
    if (business?.phone) score += 5;
    if (business?.website) score += 5;
    if (business?.hours) score += 5;
    if (business?.photos?.length > 0) score += 10;
    return Math.min(score, 100);
  };

  const visScore = getVisibilityScore();

  if (!business) return (
    <div className="text-center py-16 text-gray-400">
      <p>Claim your business first to use the preview.</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Chatbot Preview</h1>
      <p className="text-sm text-gray-500 mb-6">See exactly how the chatbot describes your business to users</p>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          {/* Query input */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Test a query</label>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePreview()}
                placeholder="Type what a user might ask..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
              <button
                onClick={() => handlePreview()}
                disabled={loading}
                className="px-5 py-2.5 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:bg-brand-blue/90 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Search size={14} /> {loading ? "..." : "Preview"}
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {suggestedQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handlePreview(q)}
                  className="px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-500 text-xs hover:bg-gray-100 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Response */}
          {(response || loading) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Chatbot Response Preview</div>
              {loading ? (
                <div className="bg-gray-50 rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-brand-navy flex items-center justify-center">
                        <MessageSquare size={13} className="text-white" />
                      </div>
                      <span className="text-xs font-bold text-gray-900">I Live Here Westchester</span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{response}</div>
                  </div>
                  {position !== null && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                      position <= 3 ? "bg-brand-light-green" : position <= 7 ? "bg-brand-light-blue" : "bg-yellow-50"
                    }`}>
                      <CheckCircle size={16} className={
                        position <= 3 ? "text-brand-green" : position <= 7 ? "text-brand-blue" : "text-yellow-600"
                      } />
                      <span className={`text-sm font-semibold ${
                        position <= 3 ? "text-brand-green" : position <= 7 ? "text-brand-blue" : "text-yellow-700"
                      }`}>
                        Your business appeared in position #{position} for this query
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Visibility score */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Visibility Score</h2>
            <div className="text-center py-4">
              <div className={`text-5xl font-extrabold ${visScore >= 80 ? "text-brand-green" : visScore >= 60 ? "text-brand-blue" : "text-brand-gold"}`}>
                {visScore}
              </div>
              <div className="text-xs text-gray-500 mt-1">out of 100</div>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-2 rounded-full transition-all ${visScore >= 80 ? "bg-brand-green" : visScore >= 60 ? "bg-brand-blue" : "bg-brand-gold"}`}
                style={{ width: `${visScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {visScore >= 80
                ? "Your listing is well-optimized. Keep it updated with seasonal content."
                : visScore >= 60
                ? "Good start. Adding more details will improve your visibility."
                : "Your listing needs attention. Fill in missing details to rank higher."}
            </p>
          </div>

          {/* Optimization tips */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Optimization Tips</h2>
            {[
              !business.description || business.description.length < 50 ? "Write a detailed business description (50+ words)" : null,
              !business.hours ? "Add your business hours" : null,
              !business.website ? "Add your website URL" : null,
              (business.keywords || []).length < 4 ? "Add more keywords (aim for 5+)" : null,
              !business.photos?.length ? "Upload storefront and interior photos" : null,
              "Create an upcoming event or promotion",
            ].filter(Boolean).map((tip, i) => (
              <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                <Zap size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-600 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
