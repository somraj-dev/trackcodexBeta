import { SystemRole } from "../types";
import { systemBus } from "./systemBus";

export interface Review {
  id: string;
  jobTitle: string;
  rating: number;
  comment: string;
  author: string;
  date: string;
}

export interface TechStatus {
  text: string;
  emoji: string;
  expiresAt?: number; // timestamp
}

export interface Achievement {
  name: string;
  imageUrl: string;
  count: number;
}

export interface UserProfile {
  id: string;
  createdAt: string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  role: string;
  systemRole: SystemRole;
  bio: string;
  company: string;
  location: string;
  website: string;
  rating: number;
  jobsCompleted: number;
  ratingCount: number;
  followers: number;
  following: number;
  communityKarma: number;
  postsCount: number;
  skills: { name: string; level: number }[]; // Level 1-100
  receivedReviews: Review[];
  techStatus?: TechStatus;
  linkedinUrl?: string;
  redditUrl?: string;
  achievements?: Achievement[];
  projectLinks?: { title: string; url: string; icon?: string }[];
  projectUrl?: string; // Single project/portfolio URL

  // New GitHub-style Profile Fields
  pronouns?: string;
  publicEmail?: string;
  displayLocalTime?: boolean;
  timezone?: string; // IANA timezone string (e.g. "Asia/Kolkata")
  socialLinks?: string[]; // Generic list of 4 social links
  orcidId?: string; // Verified ORCID iD
  // GPS Location fields
  useGPSLocation?: boolean; // Whether to use GPS for location
  gpsLocation?: string; // GPS-derived location string
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsLastUpdated?: number; // Timestamp

  // Profile README & Resume
  profileReadme?: string | null;
  resumeUrl?: string | null;
  resumeFilename?: string | null;
  resumeUploadedAt?: string | null;
  showResume?: boolean;
  showReadme?: boolean;
}

// Blank default — no personal details. Will be hydrated by initFromAuth() on login.
export const DEFAULT_PROFILE: UserProfile = {
  id: "",
  createdAt: new Date().toISOString(),
  name: "",
  username: "",
  avatar: "",
  role: "user",
  systemRole: "Developer",
  bio: "",
  company: "",
  location: "",
  website: "",
  rating: 0,
  jobsCompleted: 0,
  ratingCount: 0,
  followers: 0,
  following: 0,
  communityKarma: 0,
  postsCount: 0,
  pronouns: "Don't specify",
  displayLocalTime: false,
  publicEmail: "",
  socialLinks: ["", "", "", ""],
  projectLinks: [],
  achievements: [],
  skills: [],
  receivedReviews: [],
};

export const MOCK_USERS: UserProfile[] = [
  {
    ...DEFAULT_PROFILE,
    id: "user-alex",
    name: "Alex Rivera",
    username: "@arivera",
    role: "Senior Frontend Engineer",
    skills: [
      { name: "React", level: 95 },
      { name: "TypeScript", level: 90 },
      { name: "Three.js", level: 85 },
    ],
    avatar: "https://i.pravatar.cc/150?u=u1",
    bio: "Frontend wizard creating immersive 3D web experiences.",
    location: "San Francisco, CA",
    followers: 1240,
    following: 340,
    communityKarma: 4500,
  },
  {
    ...DEFAULT_PROFILE,
    id: "user-sarah",
    name: "Sarah Chen",
    username: "@schen_ai",
    role: "AI Research Scientist",
    skills: [
      { name: "Python", level: 98 },
      { name: "PyTorch", level: 95 },
      { name: "LLMs", level: 92 },
    ],
    avatar: "https://i.pravatar.cc/150?u=u2",
    bio: "Building the next generation of reasoning models.",
    location: "London, UK",
    followers: 8900,
    following: 120,
    communityKarma: 12000,
  },
  {
    ...DEFAULT_PROFILE,
    id: "user-david",
    name: "David Kim",
    username: "@dkim",
    role: "Full Stack Developer",
    skills: [
      { name: "Node.js", level: 88 },
      { name: "PostgreSQL", level: 85 },
      { name: "React", level: 80 },
    ],
    avatar: "https://i.pravatar.cc/150?u=u3",
    bio: "Full stack dev loving the JS ecosystem.",
    location: "Seoul, South Korea",
    followers: 450,
    following: 890,
    communityKarma: 2100,
  },
];

const STORAGE_KEY = "trackcodex_user_profile";
const STORAGE_USER_ID_KEY = "trackcodex_profile_user_id";
const UPDATE_EVENT = "trackcodex-profile-update";

export const profileService = {
  /**
   * Seed the profile from the authenticated user object (called on login).
   * Clears any stale data from a previous user session.
   */
  initFromAuth(authUser: {
    id: string;
    name: string;
    username: string;
    email?: string;
    avatar?: string;
    role?: string;
  }) {
    // If a different user was logged in before, wipe the old profile
    const storedUserId = localStorage.getItem(STORAGE_USER_ID_KEY);
    if (storedUserId && storedUserId !== authUser.id) {
      localStorage.removeItem(STORAGE_KEY);
    }
    localStorage.setItem(STORAGE_USER_ID_KEY, authUser.id);

    // Merge auth data into whatever is already saved (don't overwrite user edits)
    const saved = localStorage.getItem(STORAGE_KEY);
    const existing: Partial<UserProfile> = saved ? JSON.parse(saved) : {};

    const seeded: UserProfile = {
      ...DEFAULT_PROFILE,
      ...existing,
      // Always trust auth data for identity fields
      id: authUser.id,
      name: authUser.name || existing.name || "",
      username: authUser.username || existing.username || "",
      email: authUser.email || existing.email || "",
      avatar:
        authUser.avatar ||
        existing.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.name || authUser.username || "U")}&background=random&size=128`,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: seeded }));
  },

  /** Clear profile data on logout */
  clearProfile() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_USER_ID_KEY);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: DEFAULT_PROFILE }));
  },

  getProfile(): UserProfile {
    // ... existing implementation
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const profile = { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
        if (
          profile.techStatus?.expiresAt &&
          Date.now() > profile.techStatus.expiresAt
        ) {
          delete profile.techStatus;
          this.updateProfile(profile);
        }
        return profile;
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  },

  getUser(username: string): UserProfile | null {
    if (!username) return null;
    // Normalize query
    const query = username.startsWith("@") ? username : "@" + username;

    if (
      query === DEFAULT_PROFILE.username ||
      query === "@" + DEFAULT_PROFILE.username
    ) {
      return this.getProfile();
    }

    return MOCK_USERS.find((u) => u.username === query) || null;
  },

  updateProfile(updates: Partial<UserProfile>) {
    const current = this.getProfile();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: updated }));
  },

  updateGPSLocation(latitude: number, longitude: number, address: string) {
    this.updateProfile({
      useGPSLocation: true,
      gpsLocation: address,
      gpsLatitude: latitude,
      gpsLongitude: longitude,
      gpsLastUpdated: Date.now(),
      location: address, // Update the main location field
    });
  },

  disableGPSLocation() {
    const profile = this.getProfile();
    this.updateProfile({
      useGPSLocation: false,
      // Keep manual location or revert to default
      location: profile.location || DEFAULT_PROFILE.location,
    });
  },

  addKarma(points: number) {
    const profile = this.getProfile();
    this.updateProfile({ communityKarma: profile.communityKarma + points });

    window.dispatchEvent(
      new CustomEvent("trackcodex-notification", {
        detail: {
          title: "Reputation Gain",
          message: `You earned +${points} Karma points.`,
          type: "success",
        },
      }),
    );
  },

  receiveLike() {
    this.addKarma(1);
  },

  receiveComment() {
    this.addKarma(2);
  },

  handleNewPost() {
    const profile = this.getProfile();
    this.updateProfile({ postsCount: (profile.postsCount || 0) + 1 });
    this.addKarma(2);
  },

  addJobRating(
    newRating: number,
    feedback?: string,
    jobTitle?: string,
    employerName?: string,
  ) {
    const profile = this.getProfile();
    const totalPoints = profile.rating * profile.ratingCount;
    const newCount = profile.ratingCount + 1;
    const updatedRating = Number(
      ((totalPoints + newRating) / newCount).toFixed(1),
    );

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      jobTitle: jobTitle || "Confidential Mission",
      rating: newRating,
      comment: feedback || "Successfully completed the task requirements.",
      author: employerName || "Enterprise Partner",
      date: "Just now",
    };

    this.updateProfile({
      rating: updatedRating,
      ratingCount: newCount,
      jobsCompleted: profile.jobsCompleted + 1,
      receivedReviews: [newReview, ...profile.receivedReviews],
    });

    this.addKarma(25);
    systemBus.emit("JOB_COMPLETED", { rating: newRating });
  },

  simulateNewFollower() {
    const profile = this.getProfile();
    const newCount = profile.followers + 1;
    this.updateProfile({ followers: newCount });

    // Optional: Notification for "realism"
    // Notification for "realism" - using realtime event to show in bell icon
    window.dispatchEvent(
      new CustomEvent("trackcodex-realtime-notification", {
        detail: {
          id: `notif-${Date.now()}`,
          title: "New Follower",
          message: "You have a new follower!",
          type: "community",
          createdAt: new Date().toISOString(),
          read: false,
        },
      }),
    );
  },

  simulateUnfollow() {
    const profile = this.getProfile();
    // Prevent negative followers
    if (profile.followers > 0) {
      this.updateProfile({ followers: profile.followers - 1 });
    }
  },

  addProjectLink(link: { title: string; url: string; icon?: string }) {
    const profile = this.getProfile();
    const currentLinks = profile.projectLinks || [];
    this.updateProfile({ projectLinks: [...currentLinks, link] });
  },

  removeProjectLink(index: number) {
    const profile = this.getProfile();
    const currentLinks = profile.projectLinks || [];
    const updated = currentLinks.filter((_, i) => i !== index);
    this.updateProfile({ projectLinks: updated });
  },

  updateProjectLink(
    index: number,
    link: { title: string; url: string; icon?: string },
  ) {
    const profile = this.getProfile();
    const currentLinks = profile.projectLinks || [];
    const updated = [...currentLinks];
    updated[index] = link;
    this.updateProfile({ projectLinks: updated });
  },

  subscribe(callback: (profile: UserProfile) => void) {
    const handler = (e: any) => callback(e.detail);
    window.addEventListener(UPDATE_EVENT, handler);
    return () => window.removeEventListener(UPDATE_EVENT, handler);
  },
};
