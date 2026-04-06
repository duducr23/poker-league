"use client";
import { useState } from "react";
import { EditUserForm } from "./edit-user-form";
import { TogglePermission } from "./toggle-permission";
import { Users, ShieldCheck, Mail, CalendarDays, Layers } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  canCreateGroup: boolean;
  createdAt: string;
  groupCount: number;
}

interface Group {
  id: string;
  name: string;
}

interface Props {
  users: User[];
  groups: Group[];
  superAdminEmail: string;
}

export function AdminUsersSection({ users: initialUsers, groups, superAdminEmail }: Props) {
  const [users, setUsers] = useState(initialUsers);

  function removeUser(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(212,160,23,0.12)" }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "rgba(212,160,23,0.06)", borderBottom: "1px solid rgba(212,160,23,0.1)" }}
      >
        <Users className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-semibold text-slate-300">
          משתמשים רשומים ({users.length})
        </span>
      </div>

      {/* List */}
      <div style={{ background: "#0d0d18" }}>
        {users.map((user, idx) => {
          const isSuperAdmin = user.email?.toLowerCase() === superAdminEmail?.toLowerCase();
          return (
            <div
              key={user.id}
              className="px-4 py-4 space-y-3"
              style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
            >
              {/* Avatar + info */}
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: isSuperAdmin
                      ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
                      : "linear-gradient(135deg, #d4a017, #f5c842)",
                    color: "#0a0a12",
                  }}
                >
                  {user.name.slice(0, 2)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name + badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-100">{user.name}</p>
                    {isSuperAdmin && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: "rgba(212,160,23,0.15)", color: "#f5c842", border: "1px solid rgba(212,160,23,0.3)" }}
                      >
                        <ShieldCheck className="h-3 w-3" />סופר-אדמין
                      </span>
                    )}
                    {!isSuperAdmin && user.canCreateGroup && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                        style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}
                      >
                        פותח קבוצות
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </p>

                  {/* Stats */}
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />{user.groupCount} קבוצות
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />הצטרף {formatDate(user.createdAt)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action buttons row */}
              {!isSuperAdmin ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <EditUserForm
                    userId={user.id}
                    initialName={user.name}
                    initialEmail={user.email}
                    groups={groups}
                    onDeleted={() => removeUser(user.id)}
                  />
                  <TogglePermission userId={user.id} canCreateGroup={user.canCreateGroup} />
                </div>
              ) : (
                <div>
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: "rgba(212,160,23,0.07)", color: "#a37f18", border: "1px solid rgba(212,160,23,0.15)" }}
                  >
                    <ShieldCheck className="h-3 w-3" />גישה מלאה לכל המערכת
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {users.length === 0 && (
          <p className="text-center text-slate-500 py-10 text-sm">אין משתמשים רשומים עדיין</p>
        )}
      </div>
    </div>
  );
}
