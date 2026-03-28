"use client";
import { useAuth } from "@/lib/use-auth";
import { Eye, Search, Users, Star, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

function StatCard({ icon: Icon, label, value, color, note }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ backgroundColor: color + "15" }}>
          <Icon size={18} style={{ color }} />
        </div>
        {note && <span className="text-xs text-brand-green font-semibold">{note}</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { business } = useAuth();

  if (!business) return (
    <div className="text-center py-16">
      <h2 className="text-xl font-bold text-gray-900 mb-3">Welcome to the Business Portal</h2>
      <p className="text-gray-500 mb-6">Get started by claiming your business</p>
      <Link href="/portal/claim" className="inline-flex items-center gap-2 bg-brand-blue text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-brand-blue/90 transition">
        Claim Your Business <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Your business performance at a glance</p>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <StatCard icon={Eye} label="Chatbot Appearances" value="—" color="#2E75B6" note="" />
        <StatCard icon={Search} label="Search Matches" value="—" color="#2D8A4E" />
        <StatCard icon={Users} label="Query Impressions" value="—" color="#D4A843" />
        <StatCard icon={Star} label="Avg Position" value="—" color="#7C3AED" />
      </div>

      {/* Getting started */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Get the Most Out of Your Listing</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              title: "Complete Your Listing",
              desc: "Add a description, photos, and keywords so the chatbot can represent you accurately.",
              link: "/portal/listing",
              linkText: "Edit Listing",
              done: business.description && business.description.length > 30,
            },
            {
              title: "Preview How You Appear",
              desc: "See exactly what the chatbot says about your business when users ask.",
              link: "/portal/preview",
              linkText: "Try Preview",
              done: false,
            },
            {
              title: "Publish an Event",
              desc: "Upcoming tastings, sales, or specials? Let the chatbot surface them.",
              link: "/portal/events",
              linkText: "Add Event",
              done: false,
            },
          ].map((item, i) => (
            <div key={i} className={`rounded-lg p-4 border ${item.done ? "bg-brand-light-green border-brand-green/20" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                {item.done ? (
                  <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm font-semibold text-gray-900">{item.title}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.desc}</p>
              <Link href={item.link} className="text-xs font-semibold text-brand-blue hover:underline">
                {item.linkText} →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder for analytics preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
          <span className="text-xs text-gray-400">Stats populate as users interact with the chatbot</span>
        </div>
        <div className="text-center py-12 text-gray-300">
          <Zap size={32} className="mx-auto mb-3" />
          <p className="text-sm text-gray-400">Analytics data will appear here as people search for businesses like yours</p>
        </div>
      </div>
    </div>
  );
}
