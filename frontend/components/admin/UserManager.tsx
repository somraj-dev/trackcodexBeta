import React, { useState } from "react";

const UserManager = () => {
  const [users, setUsers] = useState<any[]>([]);

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-xl font-semibold text-gh-text tracking-tight mb-2">
            User Management
          </h1>
          <p className="text-gh-text-secondary">
            Global control over user accounts, roles, and status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-secondary text-sm">
              search
            </span>
            <input
              className="bg-gh-bg-secondary border border-gh-border rounded-xl pl-9 pr-4 py-2 text-xs text-gh-text focus:ring-1 focus:ring-primary w-64"
              placeholder="Search users..."
            />
          </div>
          <button className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-medium uppercase tracking-widest transition-all">
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gh-bg text-gh-text-secondary text-[10px] font-medium uppercase tracking-widest border-b border-gh-border">
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">System Role</th>
              <th className="px-6 py-4">Last Login / Device</th>
              <th className="px-6 py-4">Account Status</th>
              <th className="px-6 py-4 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gh-border">
            {[
              { id: "u1", name: "Somraj Saha", email: "somraj@trackcodex.dev", avatar: "https://github.com/somraj.png", role: "Super Admin", lastLogin: "2m ago", device: "Chrome / Windows 11", status: "Active" },
              { id: "u2", name: "Jane Cooper", email: "jane.c@example.com", avatar: "https://i.pravatar.cc/150?u=u2", role: "Moderator", lastLogin: "14h ago", device: "Safari / macOS", status: "Active" },
              { id: "u3", name: "Robert Fox", email: "robert.f@example.com", avatar: "https://i.pravatar.cc/150?u=u3", role: "Contributor", lastLogin: "3d ago", device: "Firefox / Linux", status: "Shadowbanned" },
            ].map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gh-bg-tertiary transition-colors group"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="size-10 rounded-xl border border-gh-border object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-gh-text">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-gh-text-secondary font-mono">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[9px] font-medium uppercase tracking-widest ${user.role === "Super Admin"
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : user.role === "Moderator"
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                            : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                        }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs text-gh-text font-medium">{user.lastLogin}</p>
                  <p className="text-[10px] text-gh-text-secondary uppercase font-semibold tracking-tighter italic">{user.device}</p>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${user.status === "Active" ? "text-emerald-500" : "text-amber-500"}`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${user.status === "Active" ? "bg-emerald-500" : "bg-amber-500"}`}
                    ></span>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="h-8 px-3 rounded-lg bg-gh-bg-tertiary text-slate-400 hover:text-white flex items-center gap-2 transition-colors text-[10px] uppercase font-bold tracking-widest border border-gh-border">
                      <span className="material-symbols-outlined !text-[16px]">
                        history
                      </span>
                      Audit
                    </button>
                    <button className="size-8 rounded-lg bg-gh-bg-tertiary text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-gh-border">
                      <span className="material-symbols-outlined !text-[18px]">
                        manage_accounts
                      </span>
                    </button>
                    <button className="size-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors border border-rose-500/20">
                      <span className="material-symbols-outlined !text-[18px]">
                        block
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManager;


