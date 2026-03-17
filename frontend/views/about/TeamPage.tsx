import React from 'react';


interface TeamMember {
  name: string;
  role: string;
  image: string;
  linkedin: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Somraj Lodhi",
    role: "CEO & Founder",
    image: "https://github.com/shadcn.png", // Fallback for Somraj if no direct link
    linkedin: "https://www.linkedin.com/in/somraj-lodhi/"
  },
  {
    name: "Mayank Singh",
    role: "COO & Co-Founder",
    image: "", // Use fallback or empty to trigger onError
    linkedin: "https://www.linkedin.com/in/mayank-s-55322a261"
  },
  {
    name: "Yash Kushwah",
    role: "Lead Engineer & Co-Founder",
    image: "https://media.licdn.com/dms/image/v2/D5603AQGnYcbGhrG7gA/profile-displayphoto-scale_200_200/B56ZtuUREuJYAc-/0/1767082367864?e=1775088000&v=beta&t=4Y_N6H7F0E4u5v8S9X9G6y9z9w9r9q9v9t9s9p9o9n9m",
    linkedin: "https://www.linkedin.com/in/yash-kushwah-53b173380"
  },
  {
    name: "Vatsal Bhadoriya",
    role: "CMO & Co-Founder",
    image: "https://media.licdn.com/dms/image/v2/D4E03AQHaMuxVRsuIsA/profile-displayphoto-scale_200_200/B4EZqD6E4rHEAY-/0/1763149631659?e=1775088000&v=beta&t=xZqoclmUQzteMAjYD8Jn7LfxgBuUY1ZcmB_7-H2pBr8",
    linkedin: "https://www.linkedin.com/in/vatsal-singh-bhadoria-17451035a"
  },
  {
    name: "Yug Mittal",
    role: "Co-Founder",
    image: "",
    linkedin: "#"
  },
  {
    name: "Abhay Gupta",
    role: "Co-Founder",
    image: "",
    linkedin: "#"
  },
  {
    name: "Sudhanshu Patel",
    role: "CTO",
    image: "",
    linkedin: "#"
  },
  {
    name: "Ku Tannya Choudhary",
    role: "Cloud Engineer",
    image: "",
    linkedin: "#"
  }
];

const TeamPage: React.FC = () => {
  return (
    <div className="team-page-container flex-1 w-full flex flex-col bg-[#000] text-white font-sans py-20 px-6">
      <div className="max-w-6xl w-full mx-auto text-center flex-1">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-[1px] w-12 bg-gh-border" />
          <span className="text-xs uppercase tracking-[0.3em] text-gh-text-secondary font-semibold">Teams</span>
          <div className="h-[1px] w-12 bg-gh-border" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight">
          The amazing team behind TrackCodex
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-card group">
              <div className="card-outer relative rounded-3xl overflow-hidden bg-[#111] border border-white/5 p-4 transition-all duration-500 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="image-wrapper aspect-[4/5] rounded-2xl overflow-hidden mb-6 bg-[#000] relative">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                
                <h3 className="text-xl font-bold mb-1 tracking-tight text-gh-text-primary">
                  {member.name}
                </h3>
                <p className="text-sm text-gh-text-secondary mb-6 font-medium">
                  {member.role}
                </p>

                <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                  <a 
                    href={member.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-icon"
                    title={`View ${member.name}'s LinkedIn Profile`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                  <div className="social-icon" title="View Twitter Profile (Coming Soon)">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
