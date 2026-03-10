import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import InboxZeroIllustration from "../components/common/InboxZeroIllustration";
import { useNotifications } from "../context/NotificationContext";
import { formatDistanceToNow } from "../utils/dateUtils";

const NotificationsView = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState("Inbox");
  const [searchQuery, setSearchQuery] = useState("is:unread");

  // Filter logic
  const filteredNotifications = notifications.filter(n => {
    if (filter === "Inbox") return !n.read;
    if (filter === "Saved") return false; // Not implemented
    if (filter === "Done") return n.read;
    return true;
  }).filter(n => {
    // Basic search impl
    if (!searchQuery) return true;
    if (searchQuery.includes("is:unread")) return !n.read;
    return n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const repoCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      const repo = n.metadata?.repo;
      if (!n.read && repo) {
        counts[repo] = (counts[repo] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [notifications]);

  return (
    <div className="flex h-full bg-gh-bg text-gh-text font-sans">
      {/* Sidebar Filter */}
      <div className="w-[296px] border-r border-gh-border p-0 hidden md:flex flex-col shrink-0 h-full">
        <div className="flex flex-col gap-0.5 py-2">
          {["Inbox", "Saved", "Done"].map((f) => (
            <div key={f} className="px-2">
              <button
                onClick={() => setFilter(f)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-[14px] flex items-center justify-between transition-colors outline-none
                                ${filter === f
                    ? "bg-[#1f6feb]/10 text-[#c9d1d9] font-semibold border-l-2 border-[#1f6feb] rounded-l-none"
                    : "text-[#c9d1d9] hover:bg-[#11141A]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined !text-[16px] opacity-70">
                    {f === "Inbox"
                      ? "inbox"
                      : f === "Saved"
                        ? "bookmark"
                        : "check"}
                  </span>
                  {f}
                </div>
                {f === "Inbox" && unreadCount > 0 && (
                  <span className="bg-[#1f6feb]/40 text-[#58a6ff] text-[12px] px-2 rounded-full font-medium leading-4">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="h-px bg-gh-border my-2 mx-0"></div>

        {/* Filters Section */}
        <div className="px-2 py-2">
          <h3 className="text-[12px] font-semibold text-[#8b949e] mb-2 px-3">
            Filters
          </h3>
          <div className="flex flex-col gap-0.5">
            {[
              {
                label: "Assigned",
                icon: "adjust",
                color: "text-[#f78166]",
              },
              {
                label: "Participating",
                icon: "chat_bubble",
                color: "text-[#c9d1d9]",
              },
              {
                label: "Mentioned",
                icon: "waving_hand",
                color: "text-[#e3b341]",
              },
              {
                label: "Team mentioned",
                icon: "groups",
                color: "text-[#e3b341]",
              },
              {
                label: "Review requested",
                icon: "reviews",
                color: "text-[#c9d1d9]",
              },
            ].map((f) => (
              <button
                key={f.label}
                className="w-full text-left px-3 py-1.5 rounded-md text-[14px] text-[#c9d1d9] hover:bg-[#11141A] hover:text-[#58a6ff] transition-colors flex items-center gap-3"
              >
                <span
                  className={`material-symbols-outlined !text-[16px] ${f.color}`}
                >
                  {f.icon}
                </span>
                {f.label}
              </button>
            ))}
            <button className="w-full text-left px-3 py-1.5 rounded-md text-[14px] text-[#8b949e] hover:bg-[#11141A] hover:text-[#58a6ff] transition-colors flex items-center gap-3">
              <span className="material-symbols-outlined !text-[16px]">
                add
              </span>
              Add new filter
            </button>
          </div>
        </div>

        <div className="h-px bg-gh-border my-2 mx-0"></div>

        {/* Repositories Section */}
        <div className="px-2 py-2 flex-1 overflow-y-auto custom-scrollbar">
          <h3 className="text-[12px] font-semibold text-[#8b949e] mb-2 px-3">
            Repositories
          </h3>
          <div className="flex flex-col gap-0.5">
            {repoCounts.map((repo) => (
              <button
                key={repo.name}
                className="w-full text-left px-3 py-1.5 rounded-md text-[14px] text-[#c9d1d9] hover:bg-[#11141A] hover:text-[#58a6ff] transition-colors flex items-start justify-between gap-2"
              >
                <span className="truncate leading-tight text-[13px]">
                  {repo.name}
                </span>
                <span className="bg-[#30363d] text-[#8b949e] text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0">
                  {repo.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Manage Notifications Footer */}
        <div className="p-4 border-t border-[#1E232E] mt-auto">
          <button className="text-[12px] text-[#8b949e] hover:text-[#58a6ff] flex items-center gap-1 transition-colors">
            Manage notifications
            <span className="material-symbols-outlined !text-[14px]">
              arrow_drop_down
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gh-bg">
        {/* Header with Search and Actions */}
        <header className="h-[60px] border-b border-gh-border flex items-center justify-between px-6 bg-gh-bg sticky top-0 z-10 shrink-0">
          {/* Search Bar Area */}
          <div className="flex items-center gap-2 flex-1 max-w-4xl">
            <div className="flex items-center gap-1 bg-gh-bg-secondary border border-gh-border rounded-md overflow-hidden">
              <button
                onClick={() => { setFilter("Inbox"); setSearchQuery(""); }}
                className={`px-3 py-1.5 text-[13px] font-medium text-gh-text hover:bg-gh-border border-r border-gh-border ${filter === "Inbox" && !searchQuery.includes("is:unread") ? "bg-gh-border" : ""}`}>
                All
              </button>
              <button
                onClick={() => setSearchQuery("is:unread")}
                className={`px-3 py-1.5 text-[13px] font-medium text-gh-text ${searchQuery.includes("is:unread") ? "bg-primary text-white" : "hover:bg-gh-border"}`}>
                Unread
              </button>
            </div>

            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[18px] text-gh-text-secondary">
                search
              </span>
              <label htmlFor="notifications-search" className="sr-only">
                Search notifications
              </label>
              <input
                id="notifications-search"
                type="text"
                className="w-full bg-gh-bg border border-gh-border rounded-md py-1.5 pl-9 pr-8 text-[14px] text-gh-text placeholder-gh-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search notifications"
                placeholder="Search notifications"
              />
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gh-text-secondary hover:text-gh-text">
                <span className="material-symbols-outlined !text-[16px]">
                  close
                </span>
              </button>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4 ml-4">
            <button className="text-[13px] font-medium text-[#8b949e] hover:text-[#58a6ff] flex items-center gap-1">
              Group by: Date
              <span className="material-symbols-outlined !text-[16px]">
                arrow_drop_down
              </span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {/* "Clear out the clutter" Banner */}
          {filteredNotifications.length > 0 && unreadCount > 0 && filter === "Inbox" && (
            <div className="bg-gradient-to-r from-[#161b22] to-[#1f2428] border border-[#1E232E] rounded-md p-6 mb-6 flex items-start justify-between shadow-sm">
              <div className="flex gap-4">
                <span className="material-symbols-outlined !text-[36px] text-[#58a6ff] mt-1">
                  Inbox
                </span>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#c9d1d9] mb-1">
                    Clear out the clutter.
                  </h3>
                  <p className="text-[14px] text-[#8b949e] leading-relaxed max-w-xl">
                    Get the most out of your new inbox by quickly and easily
                    marking all of your previously read notifications as done.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-1.5 border border-[#1E232E] rounded-md text-[14px] font-medium text-[#c9d1d9] hover:bg-[#30363d] transition-colors">
                  Dismiss
                </button>
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-1.5 bg-[#238636] border border-[#2ea043] rounded-md text-[14px] font-medium text-white hover:bg-[#2ea043] transition-colors shadow-sm"
                >
                  Mark all as done
                </button>
              </div>
            </div>
          )}

          {/* Notification List */}
          {filteredNotifications.length === 0 ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <EmptyState
                title="All caught up!"
                message="Take a break, write some code, do what you do best."
                illustration={<InboxZeroIllustration className="w-full h-auto" />}
              />
            </div>
          ) : (
            <div className="bg-gh-bg-secondary border border-gh-border rounded-md overflow-hidden shadow-sm">
              <div className="bg-gh-bg-secondary p-3 border-b border-gh-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[20px] text-gh-text-secondary">
                    check_box_outline_blank
                  </span>
                  <span className="text-[13px] font-semibold text-gh-text">
                    Select all
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gh-border">
                {filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 flex gap-3 hover:bg-gh-bg-tertiary transition-colors group cursor-pointer ${!notif.read ? "bg-gh-bg-secondary" : "bg-gh-bg"}`}
                    onClick={() => {
                      if (!notif.read) markAsRead(notif.id);
                      if (notif.link) navigate(notif.link);
                    }}
                  >
                    <div className="pt-1.5 shrink-0 px-2">
                      <span
                        className={`material-symbols-outlined !text-[18px] ${notif.type === "job"
                          ? "text-amber-500"
                          : notif.type === "mention"
                            ? "text-blue-500"
                            : notif.type === "review_request"
                              ? "text-purple-500"
                              : notif.type === "security"
                                ? "text-rose-500"
                                : "text-[#8b949e]"
                          }`}
                      >
                        {notif.type === "job"
                          ? "work"
                          : notif.type === "mention"
                            ? "alternate_email"
                            : notif.type === "review_request"
                              ? "rate_review"
                              : notif.type === "security"
                                ? "security"
                                : "forum"}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-medium text-[#8b949e]">
                          {notif.metadata?.repo || "System"}
                        </span>
                        <span className="text-[#8b949e] text-[12px]">•</span>
                        <span className="text-[12px] text-[#8b949e]">
                          {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <h3
                          className={`text-[15px] font-semibold ${!notif.read ? "text-[#c9d1d9]" : "text-[#8b949e]"}`}
                        >
                          {notif.title}
                        </h3>
                        <span className="text-[14px] text-[#8b949e] truncate max-w-xl">
                          {notif.message}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity self-start pt-1">
                      <button
                        title="Done"
                        className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-[#58a6ff]"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                      >
                        <span className="material-symbols-outlined !text-[18px]">
                          check
                        </span>
                      </button>
                      <button
                        title="Unsubscribe"
                        className="p-1 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-[#c9d1d9]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="material-symbols-outlined !text-[18px]">
                          notifications_off
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;

