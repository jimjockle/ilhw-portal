"use client";
import { useAuth } from "@/lib/use-auth";
import Sidebar from "@/components/Sidebar";
import TierBadge from "@/components/TierBadge";

export default function PortalLayout({ children }) {
  const { user, business, loading, signOut } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-sm">Loading portal...</div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar business={business} onSignOut={signOut} />
      <div className="flex-1 ml-60">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <TierBadge tier={business?.tier || "free"} />
            {business?.verified && (
              <span className="text-brand-green text-xs font-semibold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                Verified
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">{user?.email}</div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
