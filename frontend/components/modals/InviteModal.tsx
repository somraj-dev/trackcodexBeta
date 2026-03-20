import React, { useState } from 'react';
import { Link, Mail, Check, ChevronDown, Shield, User, X, Copy } from 'lucide-react';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Member {
    name: string;
    role: string;
    email: string;
    avatar: string;
    access: 'Owner' | 'Can edit' | 'View only';
    color: string;
}

const MOCK_MEMBERS: Member[] = [
    { name: 'Julia Chang', role: 'Product Lead', email: 'juliachang@cadence.pro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia', access: 'Owner', color: 'text-blue-500' },
    { name: 'Pricilia Chen', role: 'Designer', email: 'pricilia@cadence.pro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pricilia', access: 'Can edit', color: 'text-pink-500' },
    { name: 'Kevin Lim', role: 'Front End Engineer', email: 'kevin@cadence.pro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin', access: 'View only', color: 'text-blue-400' },
    { name: 'Andrew Guo', role: 'Back End Engineer', email: 'andrew@cadence.pro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andrew', access: 'View only', color: 'text-orange-500' },
    { name: 'Katherine Lou', role: 'Data Analyst', email: 'katherine@cadence.pro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Katherine', access: 'View only', color: 'text-red-500' },
];

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [access, setAccess] = useState<'Can edit' | 'View only'>('Can edit');
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopyLink = () => {
        navigator.clipboard.writeText('https://trackcodex.com/invite/project-abc-123');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-[480px] bg-white rounded-[32px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-300">
                
                {/* Header with Icon */}
                <div className="pt-10 pb-6 flex flex-col items-center text-center px-8">
                    <div className="size-16 bg-slate-50 rounded-[20px] flex items-center justify-center mb-5 border border-slate-100/80 shadow-sm transition-transform hover:scale-105">
                        <Link className="size-6 text-black rotate-45" />
                    </div>
                    <h2 className="text-[22px] font-bold text-slate-900 mb-1.5 tracking-tight">Invite People to Your Dashboard</h2>
                    <p className="text-[13px] text-slate-500 leading-relaxed max-w-[340px]">
                        Share your file with others to collect feedback, collaborate, facilitate idea and enhance communications
                    </p>
                </div>

                {/* Input Area */}
                <div className="px-8 pb-8">
                    <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-200/80 rounded-[18px] mb-8 focus-within:border-slate-300 transition-all focus-within:ring-4 focus-within:ring-slate-100/50">
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 bg-transparent px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none"
                        />
                        <div className="flex items-center border-l border-slate-200/60 pl-1.5">
                            <button className="h-full px-3 flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
                                {access}
                                <ChevronDown className="size-3.5 opacity-50" />
                            </button>
                        </div>
                        <button className="bg-[#0F172A] text-white px-5 py-2.5 rounded-[14px] text-xs font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-md shadow-slate-200">
                            Send Invitations
                        </button>
                    </div>

                    {/* Members List */}
                    <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {MOCK_MEMBERS.map((member) => (
                            <div key={member.email} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="size-10 rounded-full ring-2 ring-white overflow-hidden">
                                            <img src={member.avatar} alt={member.name} className="size-full object-cover" />
                                        </div>
                                        <div className="absolute -right-0.5 -bottom-0.5 size-3.5 bg-white rounded-full flex items-center justify-center p-0.5 shadow-sm">
                                            <div className="size-full bg-blue-500 rounded-full border border-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                                            <div className="size-3.5 bg-blue-500/10 rounded-full flex items-center justify-center">
                                                <Check className="size-2 text-blue-600 stroke-[4px]" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px]">
                                            <span className={`font-bold ${member.color}`}>{member.role}</span>
                                            <span className="size-0.5 bg-slate-200 rounded-full" />
                                            <span className="text-slate-400">{member.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-all text-xs font-bold text-slate-600">
                                    {member.access}
                                    <ChevronDown className="size-3.5 opacity-40" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
                        <Shield className="size-3.5" />
                        <span className="text-[12px] font-bold text-slate-600">Only people with access can view</span>
                        <ChevronDown className="size-3.5 opacity-50" />
                    </div>
                    <button 
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-[14px] text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm"
                    >
                        {isCopied ? (
                            <>
                                <Check className="size-3.5 text-green-500 stroke-[3px]" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="size-3.5 opacity-60" />
                                Copy link
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
