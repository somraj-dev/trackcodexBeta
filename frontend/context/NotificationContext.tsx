import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Notification } from "../types";
import { profileService, UserProfile } from "../services/activity/profile";
import { MOCK_JOBS } from "../constants";
import { api } from "../services/infra/api";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "read" | "timestamp">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const checkJobMatches = (profile: UserProfile | null) => {
    if (!profile || !profile.skills) return;

    const notifiedJobsKey = "trackcodex_notified_jobs";
    const notifiedJobs = JSON.parse(
      localStorage.getItem(notifiedJobsKey) || "[]",
    );

    const userSkillNames = profile.skills.map((s) => s.name.toLowerCase());

    MOCK_JOBS.forEach((job) => {
      // Skip if already notified
      if (notifiedJobs.includes(job.id)) return;

      // Check for overlap
      const hasMatch = job.techStack.some((tech) =>
        userSkillNames.includes(tech.toLowerCase()),
      );

      if (hasMatch) {
        // Trigger Notification
        const newNotif: Notification = {
          id: `job-match-${job.id}-${Date.now()}`,
          title: "New Job Match!",
          message: `Your skill matches the requirements for: ${job.title}`,
          type: "job_match",
          read: false,
          timestamp: new Date().toISOString(),
          link: `/marketplace/job/${job.id}`,
          metadata: { jobId: job.id, company: job.creator.name },
        };

        setNotifications((prev) => [newNotif, ...prev]);

        // Mark as notified
        notifiedJobs.push(job.id);
        localStorage.setItem(notifiedJobsKey, JSON.stringify(notifiedJobs));
      }
    });
  };

  const loadNotifications = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const list = await api.notifications.list(user.id);
      setNotifications(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Failed to load notifications", e);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load from API when user changes
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Handle Realtime Events
  useEffect(() => {
    const handleRealTimeNotif = (event: Event) => {
      const e = event as CustomEvent;
      const rawNotif = e.detail;

      // map to Notification type
      const newNotif: Notification = {
        id: rawNotif.id || `notif-${Date.now()}`,
        title: rawNotif.title,
        message: rawNotif.message,
        type: rawNotif.type || "system",
        read: rawNotif.read || false,
        timestamp: rawNotif.timestamp || rawNotif.createdAt || new Date().toISOString(),
        link: rawNotif.link,
        metadata: rawNotif.metadata,
      };

      setNotifications((prev) => [newNotif, ...prev]);
    };

    window.addEventListener(
      "trackcodex-notification",
      handleRealTimeNotif as EventListener,
    );
    return () =>
      window.removeEventListener(
        "trackcodex-notification",
        handleRealTimeNotif as EventListener,
      );
  }, []);

  // INTELLIGENT SKILL MATCHING LOGIC
  useEffect(() => {
    let lastCheckedProfileId = "";
    
    // Subscribe to profile updates to trigger check when skills change
    const unsubscribe = profileService.subscribe((profile) => {
      // Basic check to avoid redundant calls if profile ID/username hasn't changed meaningfully
      // (Deep comparison would be better, but ID is a good start)
      const currentId = profile.id + (profile.skills?.length || 0);
      if (currentId !== lastCheckedProfileId) {
        lastCheckedProfileId = currentId;
        checkJobMatches(profile);
      }
    });

    // Initial check
    const initialProfile = profileService.getProfile();
    lastCheckedProfileId = initialProfile.id + (initialProfile.skills?.length || 0);
    checkJobMatches(initialProfile);

    return () => unsubscribe();
  }, []);


  const addNotification = React.useCallback((
    notif: Omit<Notification, "id" | "read" | "timestamp">,
  ) => {
    // For local system notifications (e.g. from other components)
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}`,
      read: false,
      timestamp: new Date().toISOString(),
      type: notif.type || "system",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markAsRead = React.useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await api.notifications.markRead(id);
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  }, []);

  const markAllAsRead = React.useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      if (user?.id) {
        await api.notifications.markAllRead(user.id);
      }
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  }, [user?.id]);

  const deleteNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = React.useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
  }), [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, deleteNotification, isLoading]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

