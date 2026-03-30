"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  BarChart3, Edit3, Eye, Calendar, Camera, TrendingUp, Mail, Zap, Settings, Lock, LogOut
} from "lucide-react";

const TIER_ORDER = { free: 0, business: 1, pro: 2, enterprise: 3 };

const NAV_ITEMS = [
  { path: "/portal/dashboard", icon: BarChart3, label: "Dashboard", minTier: "business" },
  { path: "/portal/listing", icon: Edit3, label: "Listing Manager", minTier: "free" },
  { path: "/portal/preview", icon: Eye, label: "Chatbot Preview", minTier: "business" },
  { path: "/portal/events", icon: Calendar, label: "Events & Promos", minTier: "business" },
  { path: "/portal/intake", icon: Camera, label: "Photo Intake", minTier: "free" },
  { path: "/portal/analytics", icon: TrendingUp, label: "Analytics", minTier: "pro" },
  { path: "/portal/newsletter", icon: Mail, label: "Newsletter Hub", minTier: "pro" },
  { path: "/portal/intelligence", icon: Zap, label: "Market Intel", minTier: "enterprise" },
];

export default function Sidebar({ business, onSignOut }) {
  const pathname = usePathname();
  const tier = business?.tier || "free";

  const canAccess = (minTier) => TIER_ORDER[tier] >= TIER_ORDER[minTier];

  return (
    <aside className="w-60 bg-brand-navy min-h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <Image src="/logo-white.png" alt="I Live Here" width={34} height={34} className="flex-shrink-0" />
          <div>
            <div className="text-white text-base font-extrabold tracking-tight leading-none">I LIVE HERE</div>
            <div className="text-brand-gold text-[9px] font-semibold tracking-[2.5px] mt-0.5">BUSINESS PORTAL</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ path, icon: Icon, label, minTier }) => {
          const accessible = canAccess(minTier);
          const active = pathname === path;
          return accessible ? (
            <Link key={path} href={path}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                active ? "bg-brand-blue/15 text-brand-blue" : "text-white/60 hover:text-white/80 hover:bg-white/5"
              }`}>
                <Icon size={18} />
                <span className={`text-sm ${active ? "font-semibold" : ""}`}>{label}</span>
              </div>
            </Link>
          ) : (
            <div key={path} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/25 cursor-not-allowed">
              <Icon size={18} />
              <span className="text-sm flex-1">{label}</span>
              <Lock size={12} />
            </div>
          );
        })}
      </nav>

      {/* Tier upgrade */}
      {tier !== "enterprise" && (
        <div className="px-4 py-3">
          <div className="bg-brand-blue/10 rounded-lg p-3 text-center">
            <p className="text-white/60 text-xs mb-2">Unlock more features</p>
            <button className="bg-brand-gold text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-brand-gold/90 transition">
              Upgrade Plan
            </button>
          </div>
        </div>
      )}

      {/* Business info */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {business?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{business?.name || "Unclaimed"}</div>
            <div className="text-white/40 text-xs">{business?.town || ""}</div>
          </div>
          <button onClick={onSignOut} className="text-white/30 hover:text-white/60 transition">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
