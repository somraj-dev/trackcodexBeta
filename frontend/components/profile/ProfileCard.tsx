import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileService, UserProfile } from "../../services/activity/profile";
import OfferJobModal from "../jobs/offer/OfferJobModal";
import { directMessageBus } from "../../services/social/directMessageBus";
import FollowListModal from "./FollowListModal";
import { useAuth } from "../../context/AuthContext";

import ProofProfileModal from "./ProofProfileModal";
import EditStatusModal from "./EditStatusModal";

const ProfileCard = ({ profile: propProfile }: { profile?: UserProfile }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>(
    propProfile || profileService.getProfile(),
  );

  // Update local state if prop changes (also re-sync isFollowing)
  useEffect(() => {
    if (propProfile && propProfile.username !== profile.username) {
      setProfile(propProfile);
      setIsFollowing(!!propProfile.isFollowing);
    }
  }, [propProfile, profile.username]);

  const { user: currentUser } = useAuth();
  const isSelf = currentUser?.username === profile.username || currentUser?.id === profile.id;

  const [isFollowing, setIsFollowing] = useState(!!propProfile?.isFollowing);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isProofProfileOpen, setIsProofProfileOpen] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [followModalType, setFollowModalType] = useState<
    "followers" | "following"
  >("followers");

  useEffect(() => {
    // Only subscribe to global updates if we are showing the "current" user's live profile
    if (!propProfile) {
      const unsubscribe = profileService.subscribe(setProfile);
      return unsubscribe;
    }
  }, [propProfile]);

  const handleFollow = async () => {
    const targetId = profile.id;
    if (!targetId) return;

    // Optimistic update
    const nowFollowing = !isFollowing;
    setIsFollowing(nowFollowing);
    setProfile((prev) => ({
      ...prev,
      followers: Math.max(0, (prev.followers || 0) + (nowFollowing ? 1 : -1)),
    }));

    try {
      if (nowFollowing) {
        await profileService.followUser(targetId);
      } else {
        await profileService.unfollowUser(targetId);
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(!nowFollowing);
      setProfile((prev) => ({
        ...prev,
        followers: Math.max(0, (prev.followers || 0) + (nowFollowing ? -1 : 1)),
      }));
      console.error("Follow error:", error);
    }
  };

  const handleOffer = () => {
    // Intercept: Open Proof Profile first
    setIsProofProfileOpen(true);
  };

  const handleMessage = () => {
    directMessageBus.openChat({
      id: profile.username,
      name: profile.name,
      avatar: profile.avatar,
      context: "From their profile",
    });
  };

  const openFollowModal = (type: "followers" | "following") => {
    setFollowModalType(type);
    setIsFollowModalOpen(true);
  };

  const handleShareProfile = () => {
    const username = profile.username.startsWith('@')
      ? profile.username.substring(1)
      : profile.username;
    const url = `${window.location.origin}/profile/${username}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {
      // Fallback for environments without clipboard API
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  return (
    <div className="font-display relative text-gh-text">
      {/* Avatar Section with Hover Edit */}
      <div
        className="relative w-full mb-6 group cursor-pointer"
        onClick={() => navigate("/settings/profile")}
      >
        <div className="size-64 mx-auto relative group-hover:opacity-90 transition-opacity">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-emerald-500/50 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <img
            src={profile.avatar}
            className="size-full rounded-full border-2 border-primary/20 object-cover shadow-2xl relative z-10"
            alt={profile.name}
          />

          {/* Status Badge */}
          {(profile.techStatus?.emoji || isSelf) && (
            <div
              className={`absolute bottom-4 right-4 size-10 rounded-full bg-gh-bg-secondary border border-gh-border flex items-center justify-center text-xl shadow-lg z-20 transition-transform ${isSelf ? 'cursor-pointer hover:border-primary/50' : ''} neon-text`}
              onClick={(e) => {
                if (isSelf) {
                  e.stopPropagation();
                  setIsEditStatusOpen(true);
                }
              }}
              title={isSelf ? "Edit status" : profile.techStatus?.text}
            >
              {profile.techStatus?.emoji || "😊"}

              {/* Status Tooltip (On Hover) */}
              {profile.techStatus?.text && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#030014] border border-primary/20 rounded-lg px-4 py-2 w-max max-w-[200px] shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200 z-50">
                  <p className="text-xs text-white cursor-text font-medium text-center flex items-center gap-1">
                    <span>{profile.techStatus.emoji}</span>
                    <span className="truncate">{profile.techStatus.text}</span>
                  </p>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#030014] border-b border-r border-primary/20 rotate-45"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h1 className="text-[26px] font-bold text-gh-text leading-tight">
          {profile.name}
        </h1>
        <p className="text-[20px] text-gh-text-secondary font-light">
          {profile.username.startsWith('@') ? profile.username.substring(1) : profile.username}
        </p>
        {/* Share Profile Button */}
        <button
          onClick={handleShareProfile}
          title="Copy profile link"
          className="mt-2 flex items-center gap-1.5 text-xs text-gh-text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined !text-[14px]">
            {shareCopied ? 'check_circle' : 'share'}
          </span>
          {shareCopied ? 'Copied!' : 'Share profile'}
        </button>
      </div>

      {profile.bio && (
        <p className="text-base text-gh-text mb-6">{profile.bio}</p>
      )}

      {isSelf ? (
        <div className="mb-6">
          <button
            onClick={() => navigate("/settings/profile")}
            className="w-full py-1.5 bg-gh-bg-secondary text-gh-text border border-gh-border rounded-md text-sm font-bold hover:border-gh-text-secondary transition-colors"
          >
            Edit profile
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={handleFollow}
            className={`flex-1 px-4 py-1.5 rounded-md text-sm font-bold border transition-all flex items-center justify-center gap-1 ${isFollowing ? "bg-gh-bg-secondary text-gh-text-secondary border-gh-border hover:border-gh-text-secondary" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/20"}`}
            title={isFollowing ? "Unfollow" : "Follow for Updates"}
          >
            <span className="material-symbols-outlined !text-[16px]">
              {isFollowing ? "check" : "person_add"}
            </span>
            {isFollowing ? "Following" : "Follow"}
          </button>
          <button
            onClick={handleOffer}
            className="px-4 py-1.5 bg-gh-bg-secondary text-gh-text border border-gh-border rounded-md text-sm font-bold hover:border-primary/50 transition-all hover:text-primary"
          >
            Job Offer
          </button>
          <button
            onClick={handleMessage}
            className="px-4 py-1.5 bg-gh-bg-secondary text-gh-text border border-gh-border rounded-md text-sm font-bold hover:border-primary/50 transition-all hover:text-primary"
          >
            Message
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6 text-sm">
        <span className="material-symbols-outlined !text-base text-gh-text-secondary">
          group
        </span>
        <button
          onClick={() => openFollowModal("followers")}
          className="hover:text-primary transition-colors flex items-center gap-1 group/stat"
        >
          <span className="font-bold text-gh-text group-hover/stat:text-primary">
            {profile.followers}
          </span>
          <span className="text-gh-text-secondary group-hover/stat:text-primary">
            followers
          </span>
        </button>
        <span className="text-gh-text-secondary">·</span>
        <button
          onClick={() => openFollowModal("following")}
          className="hover:text-primary transition-colors flex items-center gap-1 group/stat"
        >
          <span className="font-bold text-gh-text group-hover/stat:text-primary">
            {profile.following}
          </span>
          <span className="text-gh-text-secondary group-hover/stat:text-primary">
            following
          </span>
        </button>
      </div>

      <div className="space-y-3 text-sm mb-8 mt-6">
        {profile.company && (
          <div className="flex items-center gap-3 text-gh-text">
            <span className="material-symbols-outlined !text-[20px] text-gh-text-secondary">
              business
            </span>
            <span>{profile.company}</span>
          </div>
        )}
        {profile.location && (
          <div className="flex items-center gap-3 text-gh-text">
            <span className="material-symbols-outlined !text-[20px] text-gh-text-secondary">
              {profile.useGPSLocation ? "my_location" : "location_on"}
            </span>
            <span>{profile.location}</span>
          </div>
        )}
        {(profile.publicEmail || profile.email) && (
          <div className="flex items-center gap-3 text-gh-text">
            <span className="material-symbols-outlined !text-[20px] text-gh-text-secondary">
              mail
            </span>
            <a href={`mailto:${profile.publicEmail || profile.email}`} className="hover:text-primary transition-colors hover:underline">
              {profile.publicEmail || profile.email}
            </a>
          </div>
        )}
        {profile.website && (
          <div className="flex items-center gap-3 text-gh-text">
            <span className="material-symbols-outlined !text-[20px] text-gh-text-secondary">
              link
            </span>
            <a
              href={
                profile.website.startsWith("http")
                  ? profile.website
                  : `https://${profile.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                const url = profile.website.startsWith("http")
                  ? profile.website
                  : `https://${profile.website}`;
                if (window.require) {
                  const { shell } = window.require("electron");
                  shell.openExternal(url);
                } else {
                  window.open(url, "_blank");
                }
              }}
              className="truncate hover:text-primary transition-colors hover:underline font-semibold"
            >
              {profile.website.startsWith("http")
                ? profile.website.replace(/^https?:\/\//, '')
                : profile.website}
            </a>
          </div>
        )}
        {profile.linkedinUrl && (
          <a
            href={`https://linkedin.com/in/${profile.linkedinUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-gh-text hover:text-primary hover:underline"
          >
            <svg
              className="size-5 text-gh-text-secondary"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            <span>{profile.linkedinUrl}</span>
          </a>
        )}
        {profile.redditUrl && (
          <a
            href={`https://reddit.com/user/${profile.redditUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-gh-text hover:text-primary hover:underline"
          >
            <svg
              className="size-5 text-gh-text-secondary"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-3.342 15.341c-.085.085-.188.147-.312.185-.039.013-.08.021-.12.03-.119.027-.243.04-.37.04-.32 0-.632-.124-.868-.361-.237-.236-.361-.548-.361-.868s.124-.632.361-.868c.237-.236.548-.361.868-.361.127 0 .251.013.37.04.04.008.081.017.12.03.124.038.227.1.312.185.085.085.147.188.185.312.013.039.021.08.03.12.027.119.04.243.04.37s-.013.251-.04.37c-.008.04-.017.081-.03.12-.038.124-.1.227-.185.312zm6.733 0c-.085.085-.188.147-.312.185-.039.013-.08.021-.12.03-.119.027-.243.04-.37.04-.32 0-.632-.124-.868-.361-.237-.236-.361-.548-.361-.868s.124-.632.361-.868c.237-.236.548-.361.868-.361.127 0 .251.013.37.04.04.008.081.017.12.03.124.038.227.1.312.185.085.085.147.188.185.312.013.039.021.08.03.12.027.119.04.243.04.37s-.013.251-.04.37c-.008.04-.017.081-.03.12-.038.124-.1.227-.185.312zm-4.75-2.09c.671 0 1.258-.292 1.67-.788.118.252.196.53.196.83 0 1.748-2.31 3.167-5.163 3.167-2.854 0-5.164-1.42-5.164-3.167 0-.3.078-.578.196-.83.412.496 1 .788 1.67.788.084 0 .167-.008.25-.022-1.745-.333-2.91-2.02-2.91-3.957 0-2.227 1.758-4.032 3.93-4.032.553 0 1.074.122 1.543.344.428-.198.892-.31 1.37-.31.564 0 1.103.143 1.57.39.46-.226.974-.356 1.523-.356 2.172 0 3.93 1.805 3.93 4.032 0 1.938-1.165 3.624-2.91 3.957.083.014.166.022.25.022z" />
            </svg>
            <span>{profile.redditUrl}</span>
          </a>
        )}
      </div>

      {profile.achievements && profile.achievements.length > 0 && (
        <section className="mb-6 border-t border-gh-border pt-6">
          <h2 className="text-base font-bold text-gh-text mb-4">
            Achievements
          </h2>
          <div className="flex flex-wrap gap-4">
            {profile.achievements.map((ach, i) => (
              <div
                key={i}
                className="flex items-center gap-2 group cursor-pointer"
                title={ach.name}
              >
                <img
                  src={ach.imageUrl}
                  alt={ach.name}
                  className="size-16 group-hover:scale-110 transition-transform"
                />
                {ach.count > 1 && (
                  <span className="text-sm font-bold text-gh-text-secondary">
                    x{ach.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hardcoded Organizations List for the visual mock as requested */}
      <section className="mb-6 border-t border-gh-border pt-6">
        <h2 className="text-base font-bold text-gh-text mb-4">Organizations</h2>
        <div className="flex flex-wrap gap-2">
          {(!profile.achievements || profile.achievements.length === 0) && isSelf ? (
            <div className="size-8 rounded overflow-hidden border border-gh-border hover:border-gh-text-secondary cursor-pointer" title="Quantaforge">
              <img src={profile.avatar} alt="Org" className="size-full object-cover" />
            </div>
          ) : (
            <div className="size-8 rounded overflow-hidden border border-gh-border hover:border-gh-text-secondary cursor-pointer" title="Organization">
              <img src={"https://avatars.githubusercontent.com/u/9919"} alt="Org" className="size-full object-cover" />
            </div>
          )}
        </div>
      </section>

      <div className="mt-6 pt-6 border-t border-gh-border">
        <button className="text-sm text-gh-text-secondary hover:text-rose-500">
          Block or Report
        </button>
      </div>

      {/* Render Proof Profile first */}
      {isProofProfileOpen && (
        <ProofProfileModal
          isOpen={isProofProfileOpen}
          onClose={() => setIsProofProfileOpen(false)}
          onProceed={() => {
            setIsProofProfileOpen(false);
            setIsOfferModalOpen(true);
          }}
          profile={profile}
        />
      )}

      {isOfferModalOpen && (
        <OfferJobModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          targetUser={{ name: profile.name, username: profile.username }}
        />
      )}

      {/* Follow List Modal */}
      {profile && (
        <FollowListModal
          userId={profile.id}
          type={followModalType}
          isOpen={isFollowModalOpen}
          onClose={() => setIsFollowModalOpen(false)}
        />
      )}
      {isSelf && (
        <EditStatusModal
          isOpen={isEditStatusOpen}
          onClose={() => setIsEditStatusOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfileCard;


