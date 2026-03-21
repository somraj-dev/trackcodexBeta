import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ---- Mock data  --------------------------------------------------------
const PRICE = 174.48;
const VOLUME = 202456;

const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const values = [1.2, 5, 9, 28, 120, 95, 80, 174, 130, 85, 60];
    return months.map((m, i) => ({ label: m, value: values[i] }));
};

const CHART_DATA = generateChartData();

const ACTIVITY_FEED = [
    { id: 1, icon: 'code', label: 'Committed code to react-portfolio', reward: '+12 TCK', time: '2h ago', color: 'text-green-400' },
    { id: 2, icon: 'group', label: 'Post gained 50 upvotes in Community', reward: '+8 TCK', time: '5h ago', color: 'text-green-400' },
    { id: 3, icon: 'school', label: 'Completed Skill Assessment: TypeScript', reward: '+25 TCK', time: '1d ago', color: 'text-green-400' },
    { id: 4, icon: 'work', label: 'Accepted a Mission from StrataHub', reward: '+50 TCK', time: '2d ago', color: 'text-green-400' },
    { id: 5, icon: 'inventory_2', label: 'TaskVault task completed on time', reward: '+5 TCK', time: '3d ago', color: 'text-green-400' },
    { id: 6, icon: 'star', label: 'Received a Community star award', reward: '+15 TCK', time: '4d ago', color: 'text-green-400' },
];

const ECOSYSTEM_TOOLS = [
    { icon: 'code', label: 'Code Commits', earned: 320, color: '#22c55e' },
    { icon: 'group', label: 'Community', earned: 180, color: '#3b82f6' },
    { icon: 'school', label: 'Skill Tests', earned: 250, color: '#a855f7' },
    { icon: 'work', label: 'Missions', earned: 540, color: '#f59e0b' },
    { icon: 'inventory_2', label: 'TaskVault', earned: 90, color: '#ec4899' },
];

// ---- Sub-components ----------------------------------------------------

const StatCard = ({
    icon,
    title,
    value,
    delta,
    suffix = '',
}: {
    icon: string;
    title: string;
    value: string;
    delta: string;
    suffix?: string;
}) => (
    <div className="bg-[#0F1A20] border border-[#1C2D3A] rounded-2xl p-6 flex flex-col gap-3 hover:border-[#22c55e]/30 transition-colors">
        <div className="flex items-center justify-between">
            <span className="material-symbols-outlined !text-[24px] text-[#22c55e]">{icon}</span>
            <span className="text-[11px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-full">{delta}</span>
        </div>
        <p className="text-[13px] text-[#8A9BA8] font-medium">{title}</p>
        <p className="text-[24px] font-semibold text-white tracking-tight leading-none">
            {value}
            {suffix && <span className="text-[16px] font-semibold text-[#8A9BA8] ml-1">{suffix}</span>}
        </p>
    </div>
);

// ---- Inline Sparkline Chart  -------------------------------------------
const SparklineChart = ({
    data,
    hoverTooltip,
    setHoverTooltip,
}: {
    data: { label: string; value: number }[];
    hoverTooltip: { x: number; y: number; label: string; value: number } | null;
    setHoverTooltip: (v: any) => void;
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const W = 800;
    const H = 180;
    const PADDING = { top: 16, right: 24, bottom: 32, left: 56 };

    const maxVal = Math.max(...data.map(d => d.value));
    const minVal = 0;

    const getX = (i: number) =>
        PADDING.left + (i / (data.length - 1)) * (W - PADDING.left - PADDING.right);

    const getY = (v: number) =>
        PADDING.top + (1 - (v - minVal) / (maxVal - minVal)) * (H - PADDING.top - PADDING.bottom);

    const pathD = data
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`)
        .join(' ');

    const fillD =
        `${pathD} L ${getX(data.length - 1)} ${H - PADDING.bottom} L ${getX(0)} ${H - PADDING.bottom} Z`;

    const yTicks = [1, 10, 50, 100, 175].filter(t => t <= maxVal * 1.05);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * W;
        const closest = data.reduce((prev, curr, i) => {
            return Math.abs(getX(i) - mouseX) < Math.abs(getX(prev.index) - mouseX)
                ? { index: i, ...curr }
                : prev;
        }, { index: 0, ...data[0] });
        setHoverTooltip({
            x: (getX(closest.index) / W) * 100,
            y: (getY(closest.value) / H) * 100,
            label: closest.label,
            value: closest.value,
        });
    };

    return (
        <div className="relative w-full" onMouseLeave={() => setHoverTooltip(null)}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                onMouseMove={handleMouseMove}
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Y-axis lines & labels */}
                {yTicks.map(tick => (
                    <g key={tick}>
                        <line
                            x1={PADDING.left}
                            x2={W - PADDING.right}
                            y1={getY(tick)}
                            y2={getY(tick)}
                            stroke="#1C2D3A"
                            strokeWidth="1"
                        />
                        <text
                            x={PADDING.left - 8}
                            y={getY(tick) + 4}
                            textAnchor="end"
                            fill="#4B6070"
                            fontSize="11"
                        >
                            ${tick}
                        </text>
                    </g>
                ))}

                {/* X-axis labels */}
                {data.map((d, i) => (
                    <text
                        key={d.label}
                        x={getX(i)}
                        y={H - PADDING.bottom + 18}
                        textAnchor="middle"
                        fill="#4B6070"
                        fontSize="11"
                    >
                        {d.label}
                    </text>
                ))}

                {/* Area fill */}
                <path d={fillD} fill="url(#greenGrad)" />

                {/* Line */}
                <path d={pathD} stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinejoin="round" />

                {/* Hover dot */}
                {hoverTooltip && (
                    <circle
                        cx={getX(data.findIndex(d => d.label === hoverTooltip.label))}
                        cy={getY(hoverTooltip.value)}
                        r="5"
                        fill="#22c55e"
                        stroke="#0F1A20"
                        strokeWidth="2"
                    />
                )}
            </svg>

            {/* Tooltip */}
            {hoverTooltip && (
                <div
                    className="absolute bg-[#0A1520] border border-[#1C2D3A] rounded-xl px-3 py-2 text-[12px] pointer-events-none shadow-xl"
                    style={{
                        left: `clamp(10px, calc(${hoverTooltip.x}% - 60px), calc(100% - 130px))`,
                        top: `calc(${hoverTooltip.y}% - 60px)`,
                    }}
                >
                    <p className="text-[#8A9BA8] font-medium mb-1">{hoverTooltip.label}, 10:08 PM</p>
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                            <span className="text-[#8A9BA8]">Price</span>
                            <span className="font-bold text-white ml-auto">${hoverTooltip.value.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white/40" />
                            <span className="text-[#8A9BA8]">Volume</span>
                            <span className="font-bold text-white ml-auto">{VOLUME.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ---- Main Component  ---------------------------------------------------
const TrackCoinView = () => {
    const navigate = useNavigate();
    const [hoverTooltip, setHoverTooltip] = useState<any>(null);
    const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '1Y' | 'All'>('1Y');
    const [totalBalance] = useState(1290);
    const [walletAddress] = useState('0x3Fa1...7f2C');
    const [redeemLoading, setRedeemLoading] = useState(false);

    const handleRedeem = () => {
        setRedeemLoading(true);
        setTimeout(() => setRedeemLoading(false), 2000);
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#060F16] custom-scrollbar">
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined !text-[22px] text-[#22c55e]">token</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white tracking-tight">TrackCoin</h1>
                        <p className="text-[13px] text-[#8A9BA8]">Your earnings from the TrackCodex ecosystem</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/profile')}
                        className="h-9 px-4 rounded-full border border-[#1C2D3A] text-[#8A9BA8] text-sm font-medium hover:border-[#22c55e]/40 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined !text-[16px]">account_balance_wallet</span>
                        {walletAddress}
                    </button>
                    <button
                        onClick={handleRedeem}
                        className="h-9 px-5 rounded-full bg-[#22c55e] text-black text-sm font-semibold hover:bg-[#16a34a] transition-colors flex items-center gap-2"
                    >
                        {redeemLoading ? (
                            <span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined !text-[16px]">redeem</span>
                        )}
                        Redeem
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="px-8 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon="token"
                    title="Total Balance"
                    value={totalBalance.toLocaleString()}
                    delta="+12.2% ↑"
                    suffix="TCK"
                />
                <StatCard
                    icon="trending_up"
                    title="Token Price (USD)"
                    value={`$${PRICE}`}
                    delta="+12.2% ↑"
                />
                <StatCard
                    icon="groups"
                    title="Active Users"
                    value="202,123"
                    delta="+22,325 ↑"
                />
                <StatCard
                    icon="mark_email_read"
                    title="Ecosystem Actions"
                    value="78,500"
                    delta="+22,325 ↑"
                />
            </div>

            {/* Chart Section */}
            <div className="px-8 py-4">
                <div className="bg-[#0F1A20] border border-[#1C2D3A] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-[12px] text-[#8A9BA8] font-medium mb-1">Total Revenue</p>
                            <p className="text-[28px] font-semibold text-white tracking-tight">1,856,231,212</p>
                            <p className="text-[13px] text-[#22c55e] font-semibold mt-1">
                                +22,325 (12.2%) · last 12 months
                            </p>
                        </div>
                        <div className="flex items-center gap-1 bg-[#0A1520] border border-[#1C2D3A] rounded-xl p-1">
                            {(['1W', '1M', '3M', '1Y', 'All'] as const).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setTimeRange(r)}
                                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${timeRange === r
                                            ? 'bg-[#22c55e] text-black'
                                            : 'text-[#8A9BA8] hover:text-white'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <SparklineChart
                        data={CHART_DATA}
                        hoverTooltip={hoverTooltip}
                        setHoverTooltip={setHoverTooltip}
                    />
                </div>
            </div>

            {/* Bottom Grid: Ecosystem Breakdown + Activity */}
            <div className="px-8 py-4 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ecosystem Breakdown */}
                <div className="bg-[#0F1A20] border border-[#1C2D3A] rounded-2xl p-6">
                    <h2 className="text-[14px] font-semibold text-white mb-1">Earnings by Tool</h2>
                    <p className="text-[12px] text-[#8A9BA8] mb-5">TrackCodex ecosystem contributions</p>
                    <div className="space-y-4">
                        {ECOSYSTEM_TOOLS.map(tool => {
                            const maxEarned = Math.max(...ECOSYSTEM_TOOLS.map(t => t.earned));
                            const pct = (tool.earned / maxEarned) * 100;
                            return (
                                <div key={tool.label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined !text-[18px]" style={{ color: tool.color }}>
                                                {tool.icon}
                                            </span>
                                            <span className="text-[13px] text-[#D4E0EA] font-medium">{tool.label}</span>
                                        </div>
                                        <span className="text-[13px] font-bold" style={{ color: tool.color }}>
                                            +{tool.earned} TCK
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-[#1C2D3A] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%`, backgroundColor: tool.color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Total summary */}
                    <div className="mt-6 pt-4 border-t border-[#1C2D3A] flex items-center justify-between">
                        <span className="text-[13px] text-[#8A9BA8]">Total earned (last 30 days)</span>
                        <span className="text-[15px] font-semibold text-[#22c55e]">
                            +{ECOSYSTEM_TOOLS.reduce((acc, t) => acc + t.earned, 0).toLocaleString()} TCK
                        </span>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-[#0F1A20] border border-[#1C2D3A] rounded-2xl p-6">
                    <h2 className="text-[14px] font-semibold text-white mb-1">Recent Activity</h2>
                    <p className="text-[12px] text-[#8A9BA8] mb-5">Actions that earned you TrackCoin</p>
                    <div className="space-y-3">
                        {ACTIVITY_FEED.map(item => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#0A1520] transition-colors"
                            >
                                <div className="size-9 rounded-full bg-[#0A1520] border border-[#1C2D3A] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined !text-[18px] text-[#22c55e]">{item.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] text-[#D4E0EA] font-medium truncate">{item.label}</p>
                                    <p className="text-[11px] text-[#4B6070]">{item.time}</p>
                                </div>
                                <span className="text-[13px] font-semibold text-[#22c55e] shrink-0">{item.reward}</span>
                            </div>
                        ))}
                    </div>
                    <button className="mt-4 w-full h-9 rounded-xl border border-[#1C2D3A] text-[13px] text-[#8A9BA8] font-medium hover:border-[#22c55e]/40 hover:text-white transition-colors">
                        View all activity
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrackCoinView;
