import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Users, FileText } from 'lucide-react';

interface UserHoverCardProps {
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    role?: string;
    karma: number;
    bio?: string;
    followersCount?: number;
    postsCount?: number;
    isVerified?: boolean;
  };
}

const UserHoverCard: React.FC<UserHoverCardProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${user.id}`);
  };

  return (
    <div className="absolute z-50 w-[300px] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-5 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          <img
            src={user.avatar}
            alt={user.name}
            className="size-[60px] rounded-full border-[2.5px] border-white object-cover bg-[#161b22] cursor-pointer"
            onClick={handleProfileClick}
          />
        </div>
        <button className="px-5 py-1.5 bg-white text-black text-[12px] font-bold rounded-full hover:bg-gray-200 transition-all flex items-center justify-center">
          Follow +
        </button>
      </div>

      {/* Identity Section */}
      <div className="mb-3">
        <div
          className="flex items-center gap-1 mb-0.5 cursor-pointer hover:underline decoration-white/30"
          onClick={handleProfileClick}
        >
          <h4 className="text-[17px] font-black text-white tracking-tight leading-tight">{user.name}</h4>
          {user.isVerified && (
            <CheckCircle2 className="text-[#238636] fill-[#238636]/10" size={16} />
          )}
        </div>
        <p
          className="text-[13px] text-slate-500 font-medium cursor-pointer hover:text-slate-300 transition-colors"
          onClick={handleProfileClick}
        >
          {user.username}
        </p>
      </div>

      {/* Bio Section */}
      <div className="mb-5">
        <p className="text-[13px] text-slate-300 leading-normal line-clamp-2">
          {user.bio || 'Passionate developer exploring new tech. Working on @trackcodexteam_projects.'}
        </p>
      </div>

      {/* Footer Stats Section */}
      <div className="pt-4 border-t border-[#30363d] flex items-center gap-5">
        <div className="flex items-center gap-1.5 group cursor-pointer text-slate-500 hover:text-white transition-colors">
          <Users size={16} />
          <div className="flex items-center gap-1">
            <span className="text-[14px] font-bold text-white leading-none">{user.followersCount || 233}</span>
            <span className="text-[13px] leading-none">followers</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 group cursor-pointer text-slate-500 hover:text-white transition-colors">
          <FileText size={16} />
          <div className="flex items-center gap-1">
            <span className="text-[14px] font-bold text-white leading-none">{user.postsCount || 70}</span>
            <span className="text-[13px] leading-none">posts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHoverCard;
