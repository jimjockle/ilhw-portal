"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { Calendar, DollarSign, Upload, Edit3, Trash2, Plus, X, Save } from "lucide-react";

export default function EventsPage() {
  const { business, supabase } = useAuth();
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", event_type: "event",
    start_date: "", end_date: "", time_details: "",
    location: "", cost: "", promo_code: "",
  });

  useEffect(() => {
    if (business) loadEvents();
  }, [business]);

  const loadEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("business_id", business.id)
      .order("start_date", { ascending: false });
    if (data) setEvents(data);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("events").insert({
      ...form,
      business_id: business.id,
      status: "active",
    });
    if (!error) {
      await loadEvents();
      setShowForm(false);
      setForm({
        title: "", description: "", event_type: "event",
        start_date: "", end_date: "", time_details: "",
        location: "", cost: "", promo_code: "",
      });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await supabase.from("events").delete().eq("id", id);
    await loadEvents();
  };

  if (!business) return (
    <div className="text-center py-16 text-gray-400">
      <p>Claim your business first to publish events.</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events & Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">Publish events and specials the chatbot will surface to users</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 transition flex items-center gap-2"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "New Event"}
        </button>
      </div>

      {/* New event form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Create Event or Promotion</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Friday Wine Tasting: Tuscan Reds"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Describe the event or promotion..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
              <select
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue bg-white"
              >
                <option value="event">Event</option>
                <option value="promotion">Promotion</option>
                <option value="program">Program</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Cost</label>
              <input
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="e.g., Free, $25, $15/person"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Time Details</label>
              <input
                value={form.time_details}
                onChange={(e) => setForm({ ...form, time_details: e.target.value })}
                placeholder="e.g., 5-8pm"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Promo Code (optional)</label>
              <input
                value={form.promo_code}
                onChange={(e) => setForm({ ...form, promo_code: e.target.value })}
                placeholder="e.g., ILHW10"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !form.title} className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 transition disabled:opacity-50 flex items-center gap-2">
              <Save size={14} /> {saving ? "Saving..." : "Publish Event"}
            </button>
          </div>
        </div>
      )}

      {/* Events list */}
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  event.event_type === "event" ? "bg-brand-light-blue" : event.event_type === "promotion" ? "bg-brand-light-gold" : "bg-purple-50"
                }`}>
                  {event.event_type === "event" ? <Calendar size={20} className="text-brand-blue" /> :
                   event.event_type === "promotion" ? <DollarSign size={20} className="text-brand-gold" /> :
                   <Calendar size={20} className="text-purple-500" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{event.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {event.start_date && new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {event.end_date && ` — ${new Date(event.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    {event.time_details && ` • ${event.time_details}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  event.status === "active" ? "bg-brand-light-green text-brand-green" : "bg-gray-100 text-gray-500"
                }`}>
                  {event.status === "active" ? "Live" : event.status}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-500 capitalize">{event.event_type}</span>
                <button onClick={() => handleDelete(event.id)} className="text-gray-400 hover:text-red-500 transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm && (
        <div className="text-center py-16">
          <Calendar size={40} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-gray-900 mb-2">No events yet</h3>
          <p className="text-xs text-gray-500 mb-6">Publish your first event or promotion to surface it in chatbot results</p>
        </div>
      )}

      {/* Flyer upload */}
      <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center mt-6">
        <Upload size={28} className="text-gray-300 mx-auto mb-3" />
        <div className="text-sm font-semibold text-gray-600 mb-1">Drop a flyer or image here</div>
        <div className="text-xs text-gray-400">We'll extract event details automatically using AI</div>
        <button className="mt-4 px-5 py-2 rounded-lg border border-brand-blue bg-white text-brand-blue text-xs font-semibold hover:bg-brand-light-blue transition">
          Browse Files
        </button>
      </div>
    </div>
  );
}
