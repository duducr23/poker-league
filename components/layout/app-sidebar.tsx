"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Users, LogOut, Trophy, CalendarDays, Settings, ChevronLeft, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Group { id: string; name: string }
interface AppSidebarProps {
  groups?: Group[];
  activeGroupId?: string;
  canCreateGroup?: boolean;
  userImage?: string | null;
}

const SUITS = ["♠", "♥", "♦", "♣"];

export function AppSidebar({ groups = [], activeGroupId, canCreateGroup = false, userImage }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const mainLinks = [
    { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard, suit: "♠" },
    ...(canCreateGroup
      ? [{ href: "/groups/new", label: "קבוצה חדשה", icon: Users, suit: "♣" }]
      : [{ href: "/groups/new?join=1", label: "הצטרף לקבוצה", icon: Users, suit: "♣" }]),
  ];

  const groupLinks = activeGroupId
    ? [
        { href: `/groups/${activeGroupId}`, label: "סקירה", icon: LayoutDashboard, suit: "♠" },
        { href: `/groups/${activeGroupId}/sessions`, label: "ערבי משחק", icon: CalendarDays, suit: "♥" },
        { href: `/groups/${activeGroupId}/invitations`, label: "הזמנות", icon: Mail, suit: "♦" },
        { href: `/groups/${activeGroupId}/leaderboard`, label: "טבלת דירוג", icon: Trophy, suit: "♦" },
        { href: `/groups/${activeGroupId}/settings`, label: "הגדרות", icon: Settings, suit: "♣" },
      ]
    : [];

  return (
    <aside
      className="flex h-screen w-64 flex-col"
      style={{
        background: "linear-gradient(180deg, #0d0d18 0%, #0a0a12 100%)",
        borderLeft: "1px solid rgba(212,160,23,0.12)",
      }}
    >
      {/* Logo */}
      <Link
        href={activeGroupId ? `/groups/${activeGroupId}` : "/dashboard"}
        className="flex items-center gap-3 px-6 py-5 transition-opacity hover:opacity-80"
        style={{ borderBottom: "1px solid rgba(212,160,23,0.1)" }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold"
          style={{
            background: "linear-gradient(135deg, #d4a017, #f5d060)",
            boxShadow: "0 0 14px rgba(212,160,23,0.4)",
            color: "#0a0a12",
          }}
        >
          ♠
        </div>
        <div>
          <span
            className="font-bold text-base tracking-wide"
            style={{
              background: "linear-gradient(135deg, #d4a017, #f5d060, #c8920f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Poker League
          </span>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main nav */}
        <div>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.5)" }}>
            ראשי
          </p>
          <ul className="space-y-1">
            {mainLinks.map(({ href, label, icon: Icon, suit }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                      active
                        ? "text-[#0a0a12] font-semibold"
                        : "text-slate-400 hover:text-slate-100"
                    )}
                    style={active ? {
                      background: "linear-gradient(90deg, #d4a017, #f5c842)",
                      boxShadow: "0 0 12px rgba(212,160,23,0.35)",
                    } : {}}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(212,160,23,0.07)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <span className={cn("text-xs", active ? "text-[#0a0a12]" : "text-yellow-600/70")}>{suit}</span>
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Groups */}
        {groups.length > 0 && (
          <div>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.5)" }}>
              הקבוצות שלי
            </p>
            <ul className="space-y-1">
              {groups.map((g, i) => (
                <li key={g.id}>
                  <Link
                    href={`/groups/${g.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                      activeGroupId === g.id
                        ? "text-yellow-300 font-medium"
                        : "text-slate-400 hover:text-slate-100"
                    )}
                    style={activeGroupId === g.id ? { background: "rgba(212,160,23,0.1)", borderRight: "2px solid #d4a017" } : {}}
                    onMouseEnter={e => { if (activeGroupId !== g.id) (e.currentTarget as HTMLElement).style.background = "rgba(212,160,23,0.07)"; }}
                    onMouseLeave={e => { if (activeGroupId !== g.id) (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <span className="text-yellow-600/60 text-xs">{SUITS[i % 4]}</span>
                    <span className="truncate">{g.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Group sub-nav */}
        {activeGroupId && groupLinks.length > 0 && (
          <div>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.5)" }}>
              קבוצה נוכחית
            </p>
            <ul className="space-y-1">
              {groupLinks.map(({ href, label, icon: Icon, suit }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                        active ? "text-[#0a0a12] font-semibold" : "text-slate-400 hover:text-slate-100"
                      )}
                      style={active ? {
                        background: "linear-gradient(90deg, #d4a017, #f5c842)",
                        boxShadow: "0 0 12px rgba(212,160,23,0.35)",
                      } : {}}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(212,160,23,0.07)"; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}
                    >
                      <span className={cn("text-xs", active ? "text-[#0a0a12]" : "text-yellow-600/70")}>{suit}</span>
                      <Icon className="h-4 w-4" />
                      {label}
                      <ChevronLeft className="mr-auto h-3 w-3 opacity-50" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Decorative suits strip */}
      <div
        className="px-4 py-1 text-center text-xs tracking-[0.5rem] select-none"
        style={{ color: "rgba(212,160,23,0.12)", borderTop: "1px solid rgba(212,160,23,0.08)" }}
      >
        ♠ ♥ ♦ ♣
      </div>

      {/* User footer */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(212,160,23,0.1)" }}>
        <Link href="/profile" className="flex items-center gap-3 mb-3 rounded-lg p-1.5 transition-all hover:bg-white/5 group">
          <Avatar className="h-9 w-9 shrink-0">
            {userImage ? (
              <img src={userImage} alt="avatar" className="h-full w-full rounded-full object-cover bg-slate-800 p-0.5" />
            ) : (
              <AvatarFallback
                className="text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)", color: "#0a0a12" }}
              >
                {session?.user?.name?.slice(0, 2) || "??"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-slate-100 group-hover:text-yellow-400 transition-colors">{session?.user?.name}</p>
            <p className="text-xs truncate" style={{ color: "rgba(212,160,23,0.4)" }}>לחץ לשינוי אווטאר</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-slate-500 hover:text-slate-300 hover:bg-white/5"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          יציאה
        </Button>
      </div>
    </aside>
  );
}
