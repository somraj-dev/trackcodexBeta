import React from "react";
import { UserProfile } from "../../services/activity/profile";

interface ResumeTemplateProps {
  profile: UserProfile;
  isEditable?: boolean;
}

export const ResumeTemplate: React.FC<ResumeTemplateProps> = ({ profile, isEditable = false }) => {
  return (
    <div className="bg-[#0A0A0B] text-[#E1E1E1] p-0 max-w-[900px] mx-auto shadow-2xl font-sans" id="resume-content">
      {/* Header Banner Section */}
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=1000&auto=format&fit=crop" 
          className="w-full h-full object-cover brightness-50"
          alt="Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] to-transparent"></div>
      </div>

      {/* Profile Bar */}
      <div className="px-10 -mt-12 relative z-10 flex items-end justify-between mb-8">
        <div className="flex items-end gap-6">
          <div className="size-32 rounded-3xl border-4 border-[#0A0A0B] bg-[#1C1C1E] overflow-hidden shadow-2xl">
            <img src={profile.avatar} className="w-full h-full object-cover" alt={profile.name} />
          </div>
          <div className="pb-2">
            <h1 className="text-3xl font-bold text-white mb-1">{profile.name}</h1>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="font-medium text-blue-400">{profile.role || profile.systemRole}</span>
              <span>•</span>
              <span>{profile.location || "Remote / Earth"}</span>
            </div>
          </div>
        </div>
        <div className="pb-3">
           <div className="px-6 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-900/40">Connect +</div>
        </div>
      </div>

      {/* Tabs Mockup */}
      <div className="px-10 mb-8">
        <div className="flex items-center gap-8 border-b border-white/5 pb-4">
           {["Feed", "ID", "Projects", "Activity"].map(tab => (
             <span key={tab} className={`text-xs font-bold uppercase tracking-widest ${tab === "ID" ? "text-white border-b-2 border-white pb-4 -mb-[18px]" : "text-slate-500"}`}>
               {tab}
             </span>
           ))}
        </div>
      </div>

      <div className="px-10 pb-12 space-y-6">
        {/* About Me Section */}
        <div className="bg-[#1C1C1E] rounded-2xl p-8 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-4">About Me</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {profile.bio || "Full-stack developer with a passion for building high-performance applications and clean user interfaces. Expert in ecosystem architectures and verified TrackCodex contributor."}
          </p>
          <div className="flex flex-wrap gap-8 pt-6 border-t border-white/5">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-semibold tracking-tighter mb-1">
                <span className="material-symbols-outlined !text-sm">military_tech</span>
                Grade:
              </div>
              <div className="text-xs font-bold text-white">Senior Developer +</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-semibold tracking-tighter mb-1">
                <span className="material-symbols-outlined !text-sm">language</span>
                Languages:
              </div>
              <div className="text-xs font-bold text-white">English: Native, JavaScript: Expert, Python: Fluent</div>
            </div>
          </div>
        </div>

        {/* Tools and Platforms */}
        <div className="bg-[#1C1C1E] rounded-2xl p-8 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-6">Tools and Platforms:</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { name: "TrackCodex", desc: "Core Intelligence Service", icon: "hub", color: "text-blue-400" },
              { name: "GitHub", desc: "Version Control Platform", icon: "account_tree", color: "text-emerald-400" },
              { name: "GitLab", desc: "Enterprise CI/CD Pipelines", icon: "integration_instructions", color: "text-orange-400" },
              { name: "Fiverr", desc: "Freelance Services Network", icon: "work", color: "text-green-500" },
              { name: "Figma", desc: "Interface Design System", icon: "brush", color: "text-purple-400" },
              { name: "Notion", desc: "Documentation & Knowledge", icon: "menu_book", color: "text-slate-50" },
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-black/40 flex items-center justify-center">
                   <span className={`material-symbols-outlined !text-2xl ${tool.color}`}>{tool.icon}</span>
                </div>
                <div>
                   <div className="text-sm font-bold text-white">{tool.name}</div>
                   <div className="text-[10px] text-slate-500">{tool.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Section */}
        <div className="bg-[#1C1C1E] rounded-2xl p-8 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-6">Skills:</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills && profile.skills.length > 0 ? (
              profile.skills.map(skill => (
                <span key={skill.name} className="px-4 py-1.5 bg-white/5 rounded-full text-[11px] font-bold text-slate-400 border border-white/5">
                  {skill.name}
                </span>
              ))
            ) : (
              ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS", "UI/UX Design", "System Architecture"].map(s => (
                <span key={s} className="px-4 py-1.5 bg-white/5 rounded-full text-[11px] font-bold text-slate-400 border border-white/5">
                  {s}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Soft Skills Section */}
        <div className="bg-[#1C1C1E] rounded-2xl p-8 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-6">Soft Skills:</h2>
          <div className="flex flex-wrap gap-2">
            {["Communication", "Leadership", "Problem Solving", "Team Collaboration", "Global Strategy", "Mission Driven"].map(s => (
              <span key={s} className="px-4 py-1.5 bg-white/5 rounded-full text-[11px] font-bold text-slate-400 border border-white/5">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Work Experience */}
        <div className="bg-[#1C1C1E] rounded-2xl p-8 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-8">Work Experience:</h2>
          <div className="space-y-10">
            {/* Experience Item 1 */}
            <div className="flex gap-6">
              <div className="size-14 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-white">business</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-white">TrackCodex Core Team</h3>
                    <div className="text-xs text-slate-400">Senior Systems Engineer</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-white uppercase px-2 py-0.5 bg-white/5 rounded">Jan 2024 - Present</div>
                    <div className="text-[10px] text-slate-500 mt-1">1 year 3 months</div>
                  </div>
                </div>
                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>Lead development of the decentralized intelligence verification system.</li>
                  <li>Architected the high-scale real-time mission tracking engine.</li>
                  <li>Improved system reliability by 45% through advanced diagnostic frameworks.</li>
                </ul>
              </div>
            </div>

            {/* Experience Item 2 */}
            <div className="flex gap-6">
              <div className="size-14 rounded-2xl bg-blue-900 border border-blue-500/20 flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-blue-400">shield</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-white">CyberSecurity Partners</h3>
                    <div className="text-xs text-slate-400">Security Architect</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-white uppercase px-2 py-0.5 bg-white/5 rounded">May 2022 - Dec 2023</div>
                    <div className="text-[10px] text-slate-500 mt-1">1 year 8 months</div>
                  </div>
                </div>
                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>Implemented end-to-end encrypted communication protocols for enterprise clients.</li>
                  <li>Conducted weekly security audits and vulnerability research.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div className="bg-[#1C1C1E] rounded-2xl p-8 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-8">Education:</h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="size-12 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-white">school</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white">University of Technology</h3>
                    <div className="text-xs text-slate-400">M.S. in Computer Science & Engineering</div>
                  </div>
                   <div className="text-[10px] font-bold text-slate-500 uppercase">2020 - 2022</div>
                </div>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="size-12 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-white">school</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white">Institute of Innovation</h3>
                    <div className="text-xs text-slate-400">B.S. in Software Development</div>
                  </div>
                   <div className="text-[10px] font-bold text-slate-500 uppercase">2016 - 2020</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Awards Section */}
        <div className="bg-[#1C1C1E] rounded-2xl p-8 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-8">Awards and Achievements:</h2>
          <div className="space-y-8">
             <div className="flex gap-6">
               <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-amber-500 text-2xl">emoji_events</span>
               </div>
               <div>
                  <h3 className="font-bold text-white mb-1">Global Innovation Award 2024</h3>
                  <div className="text-[10px] font-bold text-amber-500 uppercase mb-2">TrackCodex Network</div>
                  <p className="text-xs text-slate-500 leading-relaxed">Recognized for outstanding contributions to the open-source ecosystem and innovative systems design.</p>
               </div>
             </div>
             <div className="flex gap-6">
               <div className="size-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-blue-500 text-2xl">workspace_premium</span>
               </div>
               <div>
                  <h3 className="font-bold text-white mb-1">Expert Systems Certification</h3>
                  <div className="text-[10px] font-bold text-blue-500 uppercase mb-2">Professional Architects Assoc.</div>
                  <p className="text-xs text-slate-500 leading-relaxed">Certified in distributed systems and large-scale enterprise architecture.</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Footer Branded Bar */}
      <div className="bg-[#0A0A0B] px-10 py-6 border-t border-white/5 flex items-center justify-between opacity-40">
        <div className="text-[9px] uppercase font-semibold tracking-widest text-slate-500">TrackCodex Verified Vault ID: {profile.id.substring(0, 12)}</div>
        <div className="text-[9px] uppercase font-semibold tracking-widest text-slate-500">© 2026 TrackCodex ecosystem</div>
      </div>
    </div>
  );
};
