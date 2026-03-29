"use client";
import { useState, useRef } from "react";
import {
  Upload,
  Check,
  AlertTriangle,
  Download,
  Trash2,
  Search,
  X,
  Loader,
} from "lucide-react";

const CATEGORIES = [
  "Home Services",
  "Personal Services",
  "Health & Fitness",
  "Food & Dining",
  "Arts & Creative",
  "Youth Programs",
  "Financial & Insurance",
  "Retail",
  "Professional Services",
  "Automotive",
  "Education",
  "Entertainment",
  "Community",
];

export default function IntakePage() {
  const fileInputRef = useRef(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(null);

  // Form state
  const [form, setForm] = useState({
    business_name: "",
    address: "",
    town: "",
    phone: "",
    website: "",
    hours: "",
    category: "Retail",
    subcategory: "",
    keywords: [],
    description: "",
    social_media: "",
    pricing_notes: "",
  });

  const [queue, setQueue] = useState([]);
  const [dupCheckResult, setDupCheckResult] = useState(null);
  const [dupLoading, setDupLoading] = useState(false);

  // Handle file drop and selection
  const handleFileSelect = (file) => {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/heic"].includes(file.type)) {
      setError("Invalid file type. Please upload JPEG, PNG, WebP, or HEIC.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Extract business data from image
  const handleExtract = async () => {
    if (!uploadedImage) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert data URL to blob
      const response = await fetch(uploadedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, "image.jpg");
      if (notes.trim()) {
        formData.append("notes", notes);
      }

      const extractRes = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!extractRes.ok) {
        const errorData = await extractRes.json();
        throw new Error(errorData.error || "Failed to extract data");
      }

      const data = await extractRes.json();
      setExtractedData(data.extracted_data);
      setConfidenceScore(data.confidence_score);

      // Pre-fill form with extracted data
      setForm({
        business_name: data.extracted_data.business_name || "",
        address: data.extracted_data.address || "",
        town: data.extracted_data.town || "",
        phone: data.extracted_data.phone || "",
        website: data.extracted_data.website || "",
        hours: data.extracted_data.hours || "",
        category: data.extracted_data.category || "Retail",
        subcategory: data.extracted_data.subcategory || "",
        keywords: Array.isArray(data.extracted_data.keywords)
          ? data.extracted_data.keywords
          : [],
        description: data.extracted_data.description || "",
        social_media: data.extracted_data.social_media || "",
        pricing_notes: data.extracted_data.pricing_notes || "",
      });

      setDupCheckResult(null);
    } catch (err) {
      setError(err.message || "Failed to extract data from image");
      setExtractedData(null);
      setConfidenceScore(null);
    } finally {
      setLoading(false);
    }
  };

  // Check for duplicates
  const handleCheckDuplicates = async () => {
    if (!form.business_name || !form.town) {
      setError("Please enter a business name and town first.");
      return;
    }

    setDupLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dedup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: form.business_name,
          town: form.town,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to check for duplicates");
      }

      const data = await res.json();
      setDupCheckResult(data);
    } catch (err) {
      setError(err.message || "Failed to check for duplicates");
    } finally {
      setDupLoading(false);
    }
  };

  // Add to queue
  const handleApprove = () => {
    if (!form.business_name || !form.town) {
      setError("Business name and town are required.");
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...form,
      image: uploadedImage,
    };

    setQueue([...queue, newEntry]);
    setError(null);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setUploadedImage(null);
    setNotes("");
    setExtractedData(null);
    setConfidenceScore(null);
    setDupCheckResult(null);
    setForm({
      business_name: "",
      address: "",
      town: "",
      phone: "",
      website: "",
      hours: "",
      category: "Retail",
      subcategory: "",
      keywords: [],
      description: "",
      social_media: "",
      pricing_notes: "",
    });
  };

  // Remove from queue
  const handleRemoveFromQueue = (id) => {
    setQueue(queue.filter((item) => item.id !== id));
  };

  // Export queue
  const handleExportQueue = () => {
    if (queue.length === 0) {
      setError("Queue is empty.");
      return;
    }

    // Remove image from export (too large)
    const exportData = queue.map(({ image, ...rest }) => rest);
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `business-intake-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Add keyword
  const handleAddKeyword = (keyword) => {
    if (keyword && !form.keywords.includes(keyword)) {
      setForm({
        ...form,
        keywords: [...form.keywords, keyword],
      });
    }
  };

  // Remove keyword
  const handleRemoveKeyword = (keyword) => {
    setForm({
      ...form,
      keywords: form.keywords.filter((k) => k !== keyword),
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Photo Intake</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload business photos and automatically extract business data
        </p>
      </div>

      {/* Upload zone */}
      {!uploadedImage && (
        <div
          onDrop={handleFileSelect instanceof Function ? handleDragDrop : undefined}
          onDragOver={handleDragOver}
          className="bg-brand-light-blue rounded-xl border-2 border-dashed border-brand-blue p-12 text-center mb-6"
        >
          <Upload size={32} className="text-brand-blue mx-auto mb-3" />
          <div className="text-sm font-semibold text-gray-900 mb-1">
            Drop image here or browse
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Supports JPEG, PNG, WebP, HEIC (max 10MB)
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 transition"
          >
            Browse Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            className="hidden"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Image preview and extraction */}
      {uploadedImage && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left: Image */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 h-96 flex flex-col">
              <div className="text-xs font-semibold text-gray-500 mb-3">
                Uploaded Image
              </div>
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="flex-1 object-contain rounded-lg bg-gray-50"
              />
              <button
                onClick={resetForm}
                className="mt-4 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Upload Different
              </button>
            </div>
          </div>

          {/* Right: Notes and Extract button */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">
                Context Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add context: town, type of business, etc."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue resize-none"
              />
            </div>

            <button
              onClick={handleExtract}
              disabled={loading}
              className="px-4 py-3 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Search size={14} />
                  Extract Business Data
                </>
              )}
            </button>

            {confidenceScore !== null && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Confidence Score
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-brand-blue h-2 rounded-full transition"
                      style={{ width: `${Math.round(confidenceScore * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {Math.round(confidenceScore * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form - shown after extraction */}
      {extractedData && uploadedImage && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">
            Review & Edit Extracted Data
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Business Name */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Business Name *
              </label>
              <input
                value={form.business_name}
                onChange={(e) =>
                  setForm({ ...form, business_name: e.target.value })
                }
                placeholder="Business name"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Address
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street address"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>

            {/* Town */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Town *
              </label>
              <input
                value={form.town}
                onChange={(e) => setForm({ ...form, town: e.target.value })}
                placeholder="Town"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>

            {/* Website */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Website
              </label>
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="Website URL"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>

            {/* Hours */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Hours
              </label>
              <input
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                placeholder="Business hours"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Subcategory
              </label>
              <input
                value={form.subcategory}
                onChange={(e) =>
                  setForm({ ...form, subcategory: e.target.value })
                }
                placeholder="e.g., Boutique Fitness"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>

            {/* Keywords */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-2 block">
                Keywords
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  placeholder="Add keyword (press Enter)"
                  className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {form.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-3 py-1 rounded-full bg-brand-light-blue text-brand-blue text-xs font-semibold flex items-center gap-2"
                  >
                    {kw}
                    <button
                      onClick={() => handleRemoveKeyword(kw)}
                      className="hover:text-brand-blue/60"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Business description"
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue resize-none"
              />
            </div>

            {/* Social Media */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Social Media
              </label>
              <input
                value={form.social_media}
                onChange={(e) =>
                  setForm({ ...form, social_media: e.target.value })
                }
                placeholder="Social media handles"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>

            {/* Pricing Notes */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Pricing Notes
              </label>
              <input
                value={form.pricing_notes}
                onChange={(e) =>
                  setForm({ ...form, pricing_notes: e.target.value })
                }
                placeholder="Pricing information"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          {/* Duplicate check */}
          {dupCheckResult && (
            <div
              className={`rounded-lg p-4 mb-4 border ${
                dupCheckResult.is_likely_duplicate
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {dupCheckResult.is_likely_duplicate ? (
                  <AlertTriangle
                    size={16}
                    className="text-yellow-600 mt-0.5 flex-shrink-0"
                  />
                ) : (
                  <Check
                    size={16}
                    className="text-green-600 mt-0.5 flex-shrink-0"
                  />
                )}
                <div className="text-sm">
                  {dupCheckResult.is_likely_duplicate ? (
                    <>
                      <div className="font-semibold text-yellow-900 mb-2">
                        Potential duplicates found
                      </div>
                      <ul className="text-xs text-yellow-800 space-y-1">
                        {dupCheckResult.duplicates.map((dup, idx) => (
                          <li key={idx}>
                            <strong>{dup.name}</strong> ({dup.address}) -{" "}
                            {(dup.similarity_score * 100).toFixed(0)}% match
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div className="font-semibold text-green-900">
                      No duplicates found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCheckDuplicates}
              disabled={dupLoading || !form.business_name || !form.town}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
            >
              {dupLoading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search size={14} />
                  Check for Duplicates
                </>
              )}
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 transition flex items-center gap-2"
            >
              <Check size={14} />
              Approve & Add to Queue
            </button>
            <button
              onClick={() => {
                resetForm();
                setError(null);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Queue */}
      {queue.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Pending Approvals ({queue.length})
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                These entries are ready to be saved
              </p>
            </div>
            <button
              onClick={handleExportQueue}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Download size={14} />
              Export as JSON
            </button>
          </div>

          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {item.business_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.address && `${item.address} • `}
                    {item.town}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.phone && `${item.phone} • `}
                    {item.category}
                    {item.subcategory && ` • ${item.subcategory}`}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFromQueue(item.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
