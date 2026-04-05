"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EditUserForm } from "./edit-user-form";
import { TogglePermission } from "./toggle-permission";
import { Users } from "lucide-react";
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
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(212,160,23,0.12)" }}
    >
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ background: "rgba(212,160,23,0.06)", borderBottom: "1px solid rgba(212,160,23,0.1)" }}
      >
        <Users className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-semibold text-slate-300">
          משתמשים רשומים ({users.length})
        </span>
      </div>
      <div className="divide-y" style={{ background: "#0d0d18", borderColor: "rgba(212,160,23,0.07)" }}>
        {users.map((user) => {
          const isSuperAdmin = user.email?.toLowerCase() === superAdminEmail?.toLowerCase();
          return (
            <div key={user.id} className="px-5 py-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold mt-0.5"
                  style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)", color: "#0a0a12" }}
                >
                  {user.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-100 truncate">{user.name}</p>
                    {isSuperAdmin && (
                      <Badge variant="default" className="text-xs">סופר-אדמין</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {user.groupCount} קבוצות · הצטרף {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isSuperAdmin && (
                    <EditUserForm
                      userId={user.id}
                      initialName={user.name}
                      initialEmail={user.email}
                      groups={groups}
                      onDeleted={() => removeUser(user.id)}
                    />
                  )}
                  {!isSuperAdmin ? (
                    <TogglePermission userId={user.id} canCreateGroup={user.canCreateGroup} />
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-700/40">
                      גישה מלאה
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <p className="text-center text-slate-500 py-8 text-sm">אין משתמשים רשומים עדיין</p>
        )}
      </div>
    </div>
  );
}
