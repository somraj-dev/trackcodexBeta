import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "../../services/activity/profile";
import { API_BASE } from "../../services/infra/api";

interface LeaderboardUser {
    id: string;
    rank: number;
    name: string;
    handle: string;
    avatar: string;
    wins: number;
    matches: number;
    points: number;
    gems: string;
    diamonds: string;
    bestWin?: string;
}

const Leaderboard = () => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState({ days: 12, hours: 6, mins: 42 });
    const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);

    // Fetched api data
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            // Fetch current user profile first (already existing logic)
            try {
                const profile = await profileService.getProfile();
                // We will update current user stats from the leaderboard data if found, or keep default
                setCurrentUser({
                    id: "current-user-id", // Will be overwritten if found in leaderboard
                    rank: 0,
                    name: profile.name,
                    handle: profile.username || "@me",
                    avatar: profile.avatar,
                    wins: 0,
                    matches: 0,
                    points: 0,
                    gems: "0",
                    diamonds: "0",
                    bestWin: "--",
                });

                // Fetch Leaderboard API
                const response = await fetch(`${API_BASE}/leaderboard`);
                if (response.ok) {
                    const data = await response.json();
                    setLeaderboardData(data);

                    // Find current user in leaderboard to update their specific stats
                    // In a real app we'd use the real user ID from auth context
                    // For now, let's assume if we find a matching name/handle we update
                    // or just leave it as is for the "Your Rank" card which might need a specific /me endpoint
                } else {
                    console.error("Failed to fetch leaderboard data");
                }
            } catch (e) {
                console.error("Failed to fetch data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const handleUserClick = (userId: string) => {
        navigate(`/portfolio/${userId}`);
    };

    // Split data for UI (Top 3 vs Rest)
    const topUsers = leaderboardData.slice(0, 3);
    const upcomingUsers = leaderboardData.slice(3);

    return (
        <div className="min-h-screen bg-gh-bg text-gh-text p-4 md:p-8 pb-32 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Leaderboard</h1>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                    {/* Total Registered */}
                    <div className="bg-gh-bg-secondary p-4 md:p-6 rounded-2xl border border-gh-border flex items-center justify-between">
                        <div>
                            <div className="text-3xl md:text-4xl font-bold mb-1">1277</div>
                            <div className="text-gh-text-secondary text-xs md:text-sm">Total Registered</div>
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                    </div>

                    {/* Total Participated */}
                    <div className="bg-gh-bg-secondary p-4 md:p-6 rounded-2xl border border-gh-border flex items-center justify-between">
                        <div>
                            <div className="text-3xl md:text-4xl font-bold mb-1">255</div>
                            <div className="text-gh-text-secondary text-xs md:text-sm">Total Participated</div>
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#0A0A0A]lue-500/20 text-blue-400 flex items-center justify-center">
                            <span className="material-symbols-outlined">emoji_events</span>
                        </div>
                    </div>

                    {/* Countdown Timer */}
                    <div className="bg-gh-bg-secondary p-4 md:p-6 rounded-2xl border border-gh-border flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gh-text-secondary text-sm">Remaining time for completion🔥</span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 text-2xl md:text-3xl font-mono font-bold">
                            <div>
                                {timeLeft.days} <span className="text-[10px] md:text-xs text-gh-text-secondary font-sans block text-center">DAYS</span>
                            </div>
                            <span className="text-gh-text-secondary">:</span>
                            <div>
                                {timeLeft.hours} <span className="text-[10px] md:text-xs text-gh-text-secondary font-sans block text-center">HRS</span>
                            </div>
                            <span className="text-gh-text-secondary">:</span>
                            <div>
                                {timeLeft.mins} <span className="text-[10px] md:text-xs text-gh-text-secondary font-sans block text-center">MINS</span>
                            </div>
                        </div>
                        <div className="text-[10px] md:text-xs text-gh-text-secondary mt-2">Only the first three positions will be awarded prizes</div>
                    </div>
                </div>

                {/* Podium Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {topUsers.map((user) => (
                        <div
                            key={user.id}
                            className={`bg-gh-bg-secondary rounded-2xl p-6 border relative ${user.rank === 1 ? "border-yellow-500/50" : "border-gh-border"
                                }`}
                        >
                            {/* Rank Badge */}
                            <div
                                className={`absolute -top-3 left-6 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.rank === 1
                                    ? "bg-yellow-500 text-black"
                                    : user.rank === 2
                                        ? "bg-[#0A0A0A]lue-500 text-white"
                                        : "bg-purple-500 text-white"
                                    }`}
                            >
                                {user.rank}
                            </div>

                            {user.rank === 1 && (
                                <div className="absolute top-4 right-6">
                                    <span className="text-4xl">🥇</span>
                                </div>
                            )}

                            <div
                                className="flex items-center gap-4 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleUserClick(user.id)}
                            >
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className={`w-16 h-16 rounded-full border-2 ${user.rank === 1 ? "border-yellow-500" : user.rank === 2 ? "border-blue-500" : "border-purple-500"
                                        }`}
                                />
                                <div>
                                    <h3 className="font-bold text-lg leading-tight hover:text-blue-400 transition-colors text-gh-text">{user.name}</h3>
                                    <p className="text-gh-text-secondary text-sm">{user.handle}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                                <div>
                                    <div className="text-gh-text-secondary text-xs uppercase tracking-wider mb-1">Wins</div>
                                    <div className="font-bold text-lg text-gh-text">{user.wins}</div>
                                </div>
                                <div>
                                    <div className="text-gh-text-secondary text-xs uppercase tracking-wider mb-1">Matches</div>
                                    <div className="font-bold text-lg text-gh-text">{user.matches}</div>
                                </div>
                                <div>
                                    <div className="text-gh-text-secondary text-xs uppercase tracking-wider mb-1">Points</div>
                                    <div className="font-bold text-lg text-gh-text">{user.points.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-gh-border">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-yellow-500 text-sm">inventory_2</span>
                                    <span className="font-bold text-gh-text">{user.gems}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-400 text-sm">diamond</span>
                                    <span className="font-bold text-gh-text">{user.diamonds}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* User Stats Card */}
                {currentUser && (
                    <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-4 md:p-6 mb-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden gap-4 md:gap-0">
                        {/* Decorative background glow */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>

                        <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
                            <div className="flex flex-col items-center px-4">
                                <span className="text-[10px] text-gh-text-secondary uppercase tracking-wider mb-1">Your Rank</span>
                                <div className="text-3xl font-bold text-gh-text">#{currentUser.rank}</div>
                            </div>

                            <div className="h-10 w-px bg-gh-border"></div>

                            <div
                                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity flex-1 md:flex-none"
                                onClick={() => handleUserClick(currentUser.id)}
                            >
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="w-12 h-12 rounded-full border-2 border-gh-border"
                                />
                                <div>
                                    <div className="font-bold text-lg md:text-xl text-gh-text leading-tight hover:text-blue-400 transition-colors">{currentUser.name}</div>
                                    <div className="text-sm text-gh-text-secondary">{currentUser.points.toLocaleString()} Points</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 md:gap-10 w-full md:w-auto justify-around md:justify-end pr-4">
                            <div className="text-center">
                                <div className="text-[10px] text-gh-text-secondary uppercase font-bold mb-1">Wins</div>
                                <div className="font-mono text-xl">{currentUser.wins}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] text-gh-text-secondary uppercase font-bold mb-1">Matches</div>
                                <div className="font-mono text-xl">{currentUser.matches}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] text-gh-text-secondary uppercase font-bold mb-1">Best Win</div>
                                <div className="font-mono text-xl text-emerald-400">{currentUser.bestWin}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Global Ranking Table */}
                <div className="bg-gh-bg-secondary rounded-2xl border border-gh-border overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gh-border">
                        <h2 className="text-xl font-bold">Global Ranking</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gh-bg text-gh-text-secondary text-sm border-b border-gh-border">
                                    <th className="p-4 pl-6 font-medium">Rank</th>
                                    <th className="p-4 font-medium">User name</th>
                                    <th className="p-4 font-medium text-center">Match Wins</th>
                                    <th className="p-4 font-medium text-center hidden md:table-cell">Spent time</th>
                                    <th className="p-4 font-medium text-center hidden lg:table-cell">Victories</th>
                                    <th className="p-4 font-medium text-center hidden lg:table-cell">Best Win (mins)</th>
                                    <th className="p-4 pr-6 font-medium text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...topUsers, ...upcomingUsers].map((user) => (
                                    <tr key={user.id} className="border-b last:border-[#1A1A1A] border-gh-border hover:bg-gh-bg-tertiary transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="w-8 h-8 rounded-full bg-gh-bg-tertiary flex items-center justify-center font-mono text-sm">
                                                {user.rank}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer group"
                                                onClick={() => handleUserClick(user.id)}
                                            >
                                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full group-hover:opacity-80 transition-opacity" />
                                                <div>
                                                    <div className="font-semibold text-gh-text group-hover:text-blue-400 transition-colors whitespace-nowrap">{user.name}</div>
                                                    <div className="text-xs text-gh-text-secondary">ID 15876{user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-gh-text-secondary">{user.wins}</td>
                                        <td className="p-4 text-center text-gh-text-secondary hidden md:table-cell">{user.matches}</td>
                                        <td className="p-4 text-center text-gh-text-secondary hidden lg:table-cell">{Math.floor(user.wins / 10)}</td>
                                        <td className="p-4 text-center text-gh-text-secondary hidden lg:table-cell">{user.bestWin}</td>
                                        <td className="p-4 pr-6 text-right font-mono font-bold text-gh-text">
                                            {user.points.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;


