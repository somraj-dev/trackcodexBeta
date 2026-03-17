import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserProfile, profileService } from "../../services/activity/profile";

const SignOut: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = React.useState<UserProfile>(profileService.getProfile());

    React.useEffect(() => {
        return profileService.subscribe(setProfile);
    }, []);

    const handleSignout = async () => {
        await logout();
        navigate("/");
    };

    const displayName = user?.name || profile.name || "User";
    const displayAvatar = user?.avatar || profile.avatar;

    return (
        <div className="flex-1 w-full bg-[#0A0D14] flex flex-col items-center justify-center font-display text-white selection:bg-[#1f6feb] selection:text-white">
            {/* Main Container */}
            <div className="w-full max-w-[340px] flex flex-col gap-4 z-10">

                {/* Header Title */}
                <h1 className="text-[24px] font-normal text-center text-[#c9d1d9] tracking-tight mb-2">
                    Select account to sign out
                </h1>

                {/* Account Card */}
                <div className="bg-[#11141A] border border-[#1E232E] rounded-md p-4 flex items-center justify-between gap-4">

                    {/* Avatar & User Info */}
                    <div className="flex items-center gap-3 overflow-hidden">
                        <img
                            src={displayAvatar}
                            alt={displayName}
                            className="w-8 h-8 rounded-full bg-[#11141A] object-cover shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[12px] text-[#8b949e]">Signed in as</span>
                            <span className="text-[14px] font-semibold text-[#c9d1d9] truncate">
                                {displayName}
                            </span>
                        </div>
                    </div>

                    {/* Sign Out Button (Specific Account) */}
                    <button
                        onClick={handleSignout}
                        className="shrink-0 bg-[#11141A] border border-[#1E232E] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white px-3 py-1 rounded-md text-[13px] font-medium transition-colors"
                    >
                        Sign out
                    </button>
                </div>

                {/* Global Sign Out Button */}
                <button
                    onClick={handleSignout}
                    className="w-full bg-[#11141A] border border-[#1E232E] hover:bg-[#30363d] text-[#f85149] hover:text-[#ff7b72] px-4 py-[9px] rounded-md text-[14px] font-medium transition-colors"
                >
                    Sign out from all accounts
                </button>

            </div>


        </div>
    );
};

export default SignOut;


