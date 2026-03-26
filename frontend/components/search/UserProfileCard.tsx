import React from "react";
import { Link } from "react-router-dom";
import "./UserProfileCard.css";

interface UserProfileCardProps {
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
    followersCount?: number;
    rank?: number;
    isVerified?: boolean;
    url?: string;
  };
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  // Use rank 48 if not provided (as per user request example)
  const displayRank = user.rank || 48;
  const profileUrl = user.url || `/profile/${user.username}`;

  return (
    <div className="user-profile-card">
      <Link to={profileUrl} className="user-card-image-container">
        <img
          src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`}
          alt={user.name}
          className="user-card-image"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`;
          }}
        />
      </Link>

      <div className="user-card-content">
        <div className="user-card-info">
          <div className="user-card-name-row">
            <h3 className="user-card-name">{user.name}</h3>
            {user.isVerified && (
              <span className="material-symbols-outlined verified-badge">
                check_circle
              </span>
            )}
          </div>
          <p className="user-card-bio">
            {user.bio || "No bio available."}
          </p>
        </div>

        <div className="user-card-footer">
          <div className="user-card-stats">
            <div className="stat-item" title="Followers">
              <span className="material-symbols-outlined">person</span>
              <span>{user.followersCount?.toLocaleString() || "0"}</span>
            </div>
            <div className="stat-item" title="Rank">
              <span className="material-symbols-outlined">workspace_premium</span>
              <span>{displayRank}</span>
            </div>
          </div>

          <button className="follow-btn" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // TODO: Implement follow logic
          }}>
            Follow +
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
