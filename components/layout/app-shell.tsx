"use client";
import { useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { Menu } from "lucide-react";
import Link from "next/link";

interface Group { id: string; name: string }

interface Props {
  groups?: Group[];
  activeGroupId?: string;
  canCreateGroup?: boolean;
  isSuperAdmin?: boolean;
  userImage?: string | null;
  children: React.ReactNode;
}

export function AppShell({ groups, activeGroupId, canCreateGroup, isSuperAdmin, userImage, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AppSidebar
        groups={groups}
        activeGroupId={activeGroupId}
        canCreateGroup={canCreateGroup}
        isSuperAdmin={isSuperAdmin}
        userImage={userImage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content wrapper */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header
          className="flex md:hidden items-center justify-between px-4 py-3 shrink-0"
          style={{
            background: "linear-gradient(90deg, #0d0d18, #0a0a12)",
            borderBottom: "1px solid rgba(212,160,23,0.12)",
          }}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #d4a017, #f5d060)", color: "#0a0a12" }}
            >
              ♠
            </div>
            <span
              className="font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, #d4a017, #f5d060)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Poker League
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-all"
            style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)" }}
          >
            <Menu className="h-5 w-5" style={{ color: "#d4a017" }} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
