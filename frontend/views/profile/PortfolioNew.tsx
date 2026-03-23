import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddCertificateModal from "../../components/profile/AddCertificateModal";
import AddWorkExperienceModal from "../../components/profile/AddWorkExperienceModal";
import AddSkillsModal from "../../components/profile/AddSkillsModal";
import AddResponsibilitiesModal from "../../components/profile/AddResponsibilitiesModal";
import AddAchievementsModal from "../../components/profile/AddAchievementsModal";
import AddProjectModal from "../../components/profile/AddProjectModal";
import AddEducationModal from "../../components/profile/AddEducationModal";

const PortfolioNew = () => {
    const navigate = useNavigate();
    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
    const [isWorkExperienceModalOpen, setIsWorkExperienceModalOpen] = useState(false);
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
    const [isResponsibilitiesModalOpen, setIsResponsibilitiesModalOpen] = useState(false);
    const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);

    const sections = [
        {
            title: "Skills",
            description: "Spotlight your unique skills and catch the eye of recruiters looking for your exact talents!",
            buttonText: "Add Skills",
            icon: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png",
            action: () => setIsSkillsModalOpen(true)
        },
        {
            title: "Work Experience",
            description: "Narrate your professional journey and fast-track your way to new career heights!",
            buttonText: "Add Work Experience",
            icon: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Briefcase.png",
            action: () => setIsWorkExperienceModalOpen(true)
        },
        {
            title: "Education",
            description: "Showcase your academic journey and open doors to your dream career opportunities!",
            buttonText: "Add Education",
            icon: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Books.png",
            action: () => setIsEducationModalOpen(true)
        },
        {
            title: "Responsibilities",
            description: "Highlight the responsibilities you've mastered to demonstrate your leadership and expertise!",
            buttonText: "Add Responsibility",
            icon: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Person%20in%20Suit%20Levitating.png",
            action: () => setIsResponsibilitiesModalOpen(true)
        },
        {
            title: "Certificate",
            description: "Flaunt your certifications and show recruiters that you're a step ahead in your field!",
            buttonText: "Add Certificate",
            icon: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Scroll.png",
            action: () => setIsCertificateModalOpen(true)
        },
        {
            title: "Projects",
            description: "Unveil your projects to the world and pave your path to professional greatness!",
            buttonText: "Add Project",
            icon: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Hammer%20and%20Wrench.png",
            action: () => setIsProjectModalOpen(true)
        },
        {
            title: "Achievements",
            description: "Broadcast your triumphs and make a remarkable impression on industry leaders!",
            buttonText: "Add Achievement",
            icon: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Star.png",
            action: () => setIsAchievementsModalOpen(true)
        },
    ];

    return (
        <div className="flex-1 w-full bg-gh-bg text-gh-text p-8 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate("/portfolio")}
                        className="p-2 hover:bg-gh-bg-secondary rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-3xl font-bold">Add to Portfolio</h1>
                </div>

                <div className="space-y-4">
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className="bg-gh-bg-secondary border border-gh-border flex items-center justify-between p-6 rounded-xl hover:border-primary/50 transition-all group"
                        >
                            <div className="flex-1 pr-8">
                                <h3 className="text-xl font-bold text-gh-text mb-1">{section.title}</h3>
                                <p className="text-gh-text-secondary text-sm mb-4 max-w-lg">
                                    {section.description}
                                </p>
                                <button 
                                    onClick={section.action}
                                    className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 transition-all"
                                >
                                    {section.buttonText}
                                </button>
                            </div>
                            <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-gh-bg-tertiary rounded-lg p-2">
                                <img
                                    src={section.icon}
                                    alt={section.title}
                                    className="w-14 h-14 object-contain"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AddCertificateModal 
                isOpen={isCertificateModalOpen} 
                onClose={() => setIsCertificateModalOpen(false)} 
            />
            <AddWorkExperienceModal 
                isOpen={isWorkExperienceModalOpen} 
                onClose={() => setIsWorkExperienceModalOpen(false)} 
            />
            <AddSkillsModal 
                isOpen={isSkillsModalOpen} 
                onClose={() => setIsSkillsModalOpen(false)} 
            />
            <AddResponsibilitiesModal 
                isOpen={isResponsibilitiesModalOpen} 
                onClose={() => setIsResponsibilitiesModalOpen(false)} 
            />
            <AddAchievementsModal 
                isOpen={isAchievementsModalOpen} 
                onClose={() => setIsAchievementsModalOpen(false)} 
            />
            <AddProjectModal 
                isOpen={isProjectModalOpen} 
                onClose={() => setIsProjectModalOpen(false)} 
            />
            <AddEducationModal 
                isOpen={isEducationModalOpen} 
                onClose={() => setIsEducationModalOpen(false)} 
            />
        </div>
    );
};

export default PortfolioNew;
