import {
  Workspace,
  AITask,
  SecurityAlert,
  Repository,
  LiveSession,
  ProfileData,
  LibraryResource,
  LibraryCategory,
  Job,
  Strata,
  Candidate,
  GrowthPathItem,
  SkillRadarData,
  OnboardingTask,
} from "./types";
import { FileItem } from "./components/common/UniversalFileList";

export const MOCK_REPOS: Repository[] = [];

export const MOCK_WORKSPACES: Workspace[] = [];

export const MOCK_AI_TASKS: AITask[] = [
  {
    id: "1",
    taskName: "Refactor Auth Controller",
    fileName: "auth_module.ts",
    model: "Claude 3.5 Sonnet",
    result: "Diff Generated",
    timestamp: "2 mins ago",
  },
];

export const MOCK_SECURITY_ALERTS: SecurityAlert[] = [
  {
    id: "FIND-9023",
    severity: "Critical",
    vulnerability: "SQL Injection in User Login",
    repository: "auth-service-api",
    status: "Open",
  },
];

export const MOCK_SESSIONS: LiveSession[] = [];

export const MOCK_PROFILE: ProfileData = {
  id: "mock-user-alex-chen",
  name: "Alex Chen",
  username: "alexcoder",
  avatar: "https://picsum.photos/seed/alexprofile/400",
  bio: "Security-first developer specializing in Rust and cryptographic systems. 🛡️ Rating: 4.9/5",
  followersCount: 2400,
  followingCount: 180,
  company: "TrackCodex Security",
  location: "Seattle, WA",
  website: "alexchen.security",
  socialLinks: [],
};

export const MOCK_LIBRARY_RESOURCES: LibraryResource[] = [
  {
    id: "secure-auth-api",
    name: "secure-auth-api",
    description:
      "JWT-based authentication server with CSRF protection, rate limiting, and secure cookie handling pre-configured.",
    longDescription:
      "A production-ready authentication server implementation featuring JWT-based stateless authentication, CSRF protection, and rate limiting out of the box. Designed to drop into any Express.js microservice architecture. Includes pre-configured secure cookie handling and PII redaction for logs.",
    category: "Backend API",
    techStack: "TypeScript",
    techColor: "#3178c6",
    stars: 4800,
    forks: 1200,
    lastUpdated: "2 days ago",
    visibility: "PUBLIC",
    isAudited: true,
    type: "Template",
    tags: ["JWT", "OAuth2", "Express"],
    version: "v2.4.1",
    snippetPreview: `import express from 'express';\nimport { rateLimit } from 'express-rate-limit';\n\nconst limiter = rateLimit({\n  windowMs: 15 * 60 * 1000,\n  max: 100\n});\n\napp.use(limiter);`,
    installationCommand: "npx trackcodex@latest add https://21st.dev/r/easemize/ai-prompt-box",
    dependencies: ["lucide-react", "framer-motion", "@radix-ui/react-dialog", "@radix-ui/react-tooltip"],
    fileStructure: [
      {
        id: "src",
        name: "src",
        type: "folder",
        children: [
          {
            id: "components",
            name: "components",
            type: "folder",
            children: [
              {
                id: "ui",
                name: "ui",
                type: "folder",
                children: [{ 
                  id: "component.tsx", 
                  name: "component.tsx", 
                  type: "file",
                  content: `// This is a file with a demo for your component\n// That's what users will see in the preview\n// Create new files in this directory to add more demos\n\nimport { Component } from "@/components/ui/component";\n\n// ONLY DEFAULT EXPORT WILL BE TREATED AS A DEMO\nexport default function DemoOne() {\n  return <Component />;\n}`
                }]
              }
            ]
          },
          {
            id: "demos",
            name: "demos",
            type: "folder",
            children: [{ 
              id: "default.tsx", 
              name: "default.tsx", 
              type: "file",
              content: `import React from 'react';\n\nexport const DefaultDemo = () => {\n  return (\n    <div className="p-4 bg-gh-bg-secondary rounded-xl border border-gh-border">\n      <h2 className="text-lg font-bold text-gh-text mb-4">Default Demo</h2>\n      <p className="text-sm text-gh-text-secondary">This is a sample demo for the functional file structure.</p>\n    </div>\n  );\n};`
            }]
          },
          { 
            id: "index.css", 
            name: "index.css", 
            type: "file",
            content: `/* Global styles */\n:root {\n  --primary: #3b82f6;\n  --gh-bg: #0d1117;\n}\n\nbody {\n  margin: 0;\n  padding: 0;\n  font-family: 'Inter', sans-serif;\n  background: var(--gh-bg);\n}`
          }
        ]
      }
    ],
    changelog: [
      { id: "v2.4.1", version: "v2.4.1", date: "29s", changes: "Fix mission visibility in Marketplace and switch to Railway producti...", status: "Ready", branch: "main", commit: "21366ff" },
      { id: "v2.4.0", version: "v2.4.0", date: "30s", changes: "theme: Improve theme resolution fallback", status: "Ready", branch: "main", commit: "3fdbf1a" },
      { id: "v2.3.9", version: "v2.3.9", date: "28s", changes: "s2", status: "Ready", branch: "main", commit: "c92bb34" },
      { id: "v2.3.8", version: "v2.3.8", date: "30s", changes: "s", status: "Ready", branch: "main", commit: "8878bb4" }
    ]
  },
  {
    id: "dashboard-pro-kit",
    name: "Enterprise Dashboard UI Kit & Prompt",
    description:
      "A comprehensive UI design system and AI generation prompt for building secure, data-dense enterprise dashboards.",
    longDescription:
      "A comprehensive UI design system and AI generation prompt for building secure, data-dense enterprise dashboards. Optimized for financial and analytics workloads with pre-built accessibility features.",
    category: "UI & Design",
    techStack: "Tailwind CSS",
    techColor: "#06b6d4",
    stars: 5200,
    forks: 1400,
    lastUpdated: "2 days ago",
    visibility: "PUBLIC",
    isAudited: true,
    type: "Kit",
    tags: ["React", "Dashboard"],
    version: "v2.4.0",
    snippetPreview: `Generate a responsive {{DashboardType}} layout using CSS Grid.\nInclude a sidebar navigation with {{NavItems}} items.\nThe main content area should feature:\n1. A summary cards row displaying {{KPI_Metrics}}.\n...`,
  },
];

export const MOCK_LIBRARY_CATEGORIES: LibraryCategory[] = [
  { id: "backend-api", name: "Backend API", icon: "api", count: 12 },
  { id: "ui-design", name: "UI & Design", icon: "design_services", count: 4 },
];

export const MOCK_JOBS: Job[] = [
  {
    id: "stripe-billing-eng",
    title: "Senior Billing Engineer",
    description:
      "Implement idempotency keys for terminal reader connections. Work with the financial infrastructure team to ensure 99.999% reliability.",
    budget: "$180k - $240k",
    type: "Full-time",
    status: "Open",
    techStack: ["TypeScript", "React", "API Design"],
    repoId: "stripe/stripe-terminal-js",
    creator: {
      name: "Stripe",
      avatar: "https://cdn.worldvectorlogo.com/logos/stripe-2.svg",
    },
    postedDate: "2 hours ago",
    website: "stripe.com/billing",
    longDescription:
      "Stripe is looking for a Senior Billing Engineer to help build the financial infrastructure of the internet.\n\n### Responsibilities\n- Design and implement idempotency keys for terminal reader connections.\n- Optimize billing workflows for high-volume transaction processing.\n- Collaborate with product managers to define new billing features.\n\n### Requirements\n- 5+ years of experience with TypeScript and Node.js.\n- Strong understanding of distributed systems and API design.\n- Experience with financial software is a plus.",
  },
  {
    id: "netflix-platform-eng",
    title: "Platform Integrity Engineer",
    description:
      "Optimize circuit breaker timeout propagation for 5G edge cases. Ensure streaming quality even in degraded network conditions.",
    budget: "$220k - $310k",
    type: "Full-time",
    status: "Open",
    techStack: ["Java", "Spring", "Distributed Systems"],
    repoId: "Netflix/Hystrix",
    creator: {
      name: "Netflix",
      avatar: "https://cdn.worldvectorlogo.com/logos/netflix-3.svg",
    },
    postedDate: "4 hours ago",
    website: "netflix.com/careers",
    longDescription:
      "Netflix is redefining the future of entertainment.\n\n### The Role\nJoin our Platform Integrity team to ensure our global streaming service remains resilient under all conditions. You will be working on core infrastructure components that handle millions of requests per second.",
  },
  {
    id: "vercel-frontend-arch",
    title: "Frontend Infra Architect",
    description:
      "Refactor middleware runtime to support edge-cached WASM assets. Lead the architecture for the next generation of Next.js.",
    budget: "$160k - $210k",
    type: "Contract",
    status: "Open",
    techStack: ["Rust", "Go", "Next.js"],
    repoId: "vercel/next.js",
    creator: {
      name: "Vercel",
      avatar: "https://cdn.worldvectorlogo.com/logos/vercel.svg",
    },
    postedDate: "1 day ago",
  },
  {
    id: "airbnb-security-lead",
    title: "Systems Security Lead",
    description:
      "Implement strict CSP policy enforcement across legacy modules. protect user data and ensure compliance with global regulations.",
    budget: "$195k - $265k",
    type: "Full-time",
    status: "Open",
    techStack: ["Node.js", "Security", "React"],
    repoId: "airbnb/javascript",
    creator: {
      name: "Airbnb",
      avatar: "https://cdn.worldvectorlogo.com/logos/airbnb.svg",
    },
    postedDate: "2 days ago",
  },
  {
    id: "j1",
    title: "DeFi Protocol Security Audit",
    description:
      "Perform a comprehensive security audit on our upcoming DeFi lending protocol built on Solana.",
    budget: "$8,500",
    type: "Contract",
    status: "Open",
    techStack: ["Rust", "Solana", "Security"],
    repoId: "trackcodex-backend",
    creator: {
      name: "SolanaLend Team",
      avatar: "https://picsum.photos/seed/solana/64",
    },
    postedDate: "2 hours ago",
  },
  {
    id: "j2",
    title: "React Performance Optimization",
    description:
      "Optimize a data-heavy analytics dashboard to reduce bundle size and improve TTI.",
    budget: "$3,200",
    type: "Gig",
    status: "InProgress",
    techStack: ["React", "TypeScript", "Performance"],
    repoId: "dashboard-ui",
    creator: {
      name: "AnalyticsPro",
      avatar: "https://picsum.photos/seed/analytics/64",
    },
    postedDate: "Yesterday",
    metadata: {
      participationType: 'Team Participation',
      minTeamSize: 3,
      maxTeamSize: 5
    }
  },
  {
    id: "team-test-mission",
    title: "Team Mission (Required: 3 Members)",
    description: "Use this mission to test the Create A Team and Join A Team features.",
    budget: "$5,000",
    type: "Gig",
    status: "Open",
    techStack: ["Teamwork", "Collaboration"],
    repoId: "test-repo",
    creator: {
      name: "TrackCodex Test",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=ghost",
    },
    postedDate: "Just now",
    metadata: {
      participationType: 'Team Participation',
      minTeamSize: 3,
      maxTeamSize: 3
    }
  },
  {
    id: "mega-ai-hackathon",
    title: "India's Biggest Mega AI Hackathon",
    description: "Multi-agent environment where AI systems manage a 4-way intersection with emergency vehicle prioritization.",
    budget: "Free Registration",
    type: "Hackathon",
    status: "Open",
    techStack: ["AI", "PyTorch", "Multi-Agent Systems", "Meta"],
    repoId: "scaler/hackathon",
    creator: {
      name: "Scaler School of Technology",
      avatar: "https://www.scaler.com/favicon.ico",
    },
    postedDate: "Just now",
    website: "https://www.scaler.com/school-of-technology/meta-pytorch-hackathon/register",
    longDescription: `### India's Biggest Mega AI Hackathon
  
  Experience the thrill of building cutting-edge AI systems in this massive hackathon. 
  
  #### Tracks
  
  **1. Traffic Management**
  Multi-agent environment where AI systems manage a 4-way intersection with emergency vehicle prioritization.
  
  **2. Support: Customer Service Agents**
  Complex environment where agents resolve multi-step queries using external tools and APIs.
  
  **3. Workflow: Email Triage System**
  Agents learn to prioritize, categorize, and route emails using contextual understanding.
  
  **4. Gaming: Multi-Agent Strategy**
  Agents compete in a strategic game environment with incomplete information and evolving rules.`,
  },
];

export const MOCK_STRATA: Strata[] = [
    {
        id: "trackcodex",
        name: "trackcodex",
        avatar: "https://picsum.photos/seed/trackcodex/200",
        description: "Enterprise management for QuantaForge projects.",
        website: "trackcodex.com",
        location: "San Francisco, CA",
        members: [
            { username: "alexcoder", name: "Alex Chen", avatar: "https://picsum.photos/seed/alexprofile/32", role: "OWNER", lastActive: "Just now" }
        ],
        teams: [
            { id: "core", name: "Core Engineering", description: "Main platform development team", memberCount: 12, repoCount: 4 }
        ],
        repositories: MOCK_REPOS.slice(0, 3)
    }
];

export const MOCK_MARKETPLACE_JOBS = [
    {
        id: "1",
        title: "Senior Product Designer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "polymer", // Closest to Figma's swirl
        iconBg: "#fee2e2", // light-pink/red
        applicationUrl: "https://unstop.com/jobs/senior-product-designer-trackcodex-12345",
        metadata: {
            location: "Bangalore, India",
            endDate: "2026-05-15T23:59:59Z",
            responsibilities: [
                "Create high-fidelity mockups and prototypes using Figma.",
                "Collaborate with product managers to define user flows.",
                "Conduct user research and usability testing.",
                "Maintain and evolve the design system components."
            ],
            requirements: [
                "Bachelor's degree in Design or related field.",
                "Portfolio demonstrating expertise in UI/UX design.",
                "Proficiency in Figma and Adobe Creative Suite.",
                "Experience with responsive web and mobile design."
            ],
            recruitmentProcess: [
                { name: "Portfolio Review", detail: "Review of your past work", type: "Offline", icon: "fact_check" },
                { name: "Design Challenge", detail: "Take-home assignment", type: "Online", icon: "edit" }
            ],
            additionalInfo: {
                salary: { min: "₹ 15,00,000", max: "₹ 25,00,000", period: "/Year" },
                workDetail: "Hybrid Model (3 days office)",
                jobType: { type: "In Office", timing: "Full Time" }
            }
        }
    },
    {
        id: "2",
        title: "Vuejs Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "eco", // Closest to Vue's V-leaf
        iconBg: "#dcfce7", // light-green
        applicationUrl: "https://unstop.com/jobs/vuejs-developer-trackcodex-67890",
        metadata: {
            location: "Remote",
            endDate: "2026-04-30T23:59:59Z",
            responsibilities: [
                "Develop and maintain frontend applications using Vue.js 3 and Vite.",
                "Implement scalable state management with Pinia.",
                "Write clean, modular, and well-documented Vue components.",
                "Collaborate with backend developers for API integration."
            ],
            requirements: [
                "Strong proficiency in JavaScript/TypeScript.",
                "3+ years of experience with Vue.js framework.",
                "Familiarity with Tailwind CSS and CSS-in-JS.",
                "Knowledge of frontend build tools like Vite and Webpack."
            ],
            recruitmentProcess: [
                { name: "Technical Interview", detail: "Deep dive into Vue architecture", type: "Online", icon: "code" }
            ],
            additionalInfo: {
                salary: { min: "₹ 8,00,000", max: "₹ 18,00,000", period: "/Year" },
                workDetail: "Remote First",
                jobType: { type: "Remote", timing: "Full Time" }
            }
        }
    },
    {
        id: "3",
        title: "ReactJS Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "science", // Closest to React
        iconBg: "#e0f2fe", // light-blue
        applicationUrl: "https://unstop.com/jobs/reactjs-developer-trackcodex-11223",
        metadata: {
            location: "Hyderabad, India",
            endDate: "2026-06-10T23:59:59Z",
            responsibilities: [
                "Build dynamic user interfaces with React and Next.js.",
                "Optimize application performance for maximum speed.",
                "Work closely with UI/UX designers to implement pixel-perfect designs.",
                "Participate in code reviews and advocate for best practices."
            ],
            requirements: [
                "2+ years of professional React development experience.",
                "Proficiency in React Hooks, Context API, and Redux.",
                "Experience with Next.js and Server-Side Rendering (SSR).",
                "Strong understanding of CSS Flexbox and Grid."
            ],
            recruitmentProcess: [
                { name: "Initial Screening", detail: "General background check", type: "Online", icon: "person_search" },
                { name: "React Quiz", detail: "Interactive assessment", type: "Online", icon: "quiz" }
            ],
            additionalInfo: {
                salary: { min: "₹ 12,00,000", max: "₹ 20,00,000", period: "/Year" },
                workDetail: "Standard 40-hour work week",
                jobType: { type: "In Office", timing: "Full Time" }
            }
        }
    },
    {
        id: "4",
        title: "Python Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "token", // Closest to Python logo swirl
        iconBg: "#fef9c3", // light-yellow
    },
    {
        id: "5",
        title: "Senior Product Designer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "polymer",
        iconBg: "#fee2e2",
    },
    {
        id: "6",
        title: "Python Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "token",
        iconBg: "#fef9c3",
    },
    {
        id: "7",
        title: "Java Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "coffee", // Java
        iconBg: "#f1f5f9", // light-grey
    },
    {
        id: "8",
        title: "Vuejs Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "eco",
        iconBg: "#dcfce7",
    },
];

export const MOCK_GROWTH_DATA = {
  skillRadar: [
    { subject: "System Design", score: 85, fullMark: 100 },
    { subject: "Frontend", score: 70, fullMark: 100 },
    { subject: "Backend", score: 90, fullMark: 100 },
    { subject: "Security", score: 95, fullMark: 100 },
    { subject: "Leadership", score: 75, fullMark: 100 },
  ] as SkillRadarData[],
  growthPath: [
    {
      skill: "Kubernetes",
      category: "DevOps",
      currentProficiency: 75,
      targetLevel: "Staff Engineer",
      recommendation: "Level Up Soon",
    },
    {
      skill: "GraphQL",
      category: "API",
      currentProficiency: 45,
      targetLevel: "Intermediate",
      recommendation: "View Internal Docs",
    },
    {
      skill: "Cybersecurity",
      category: "Security",
      currentProficiency: 88,
      targetLevel: "Advanced",
      recommendation: "Exam Prep",
    },
  ] as GrowthPathItem[],
};

export const MOCK_ONBOARDING_TASKS: OnboardingTask[] = [
  {
    id: "1",
    title: "Request SSH keys & VPN access",
    description: "Completed 2 days ago",
    status: "completed",
    type: "required",
  },
  {
    id: "2",
    title: "Local environment setup (Docker & Node v20)",
    description: "Priority: High",
    status: "pending",
    type: "priority",
  },
  {
    id: "3",
    title: "Initial commit to personal sandbox repo",
    description: "Due by Friday",
    status: "pending",
    type: "goal",
  },
  {
    id: "4",
    title: "Join #eng-general and introduce yourself",
    description: "Social goal",
    status: "pending",
    type: "social",
  },
];

// --- IDE ECOSYSTEM MOCK DATA ---

export const MOCK_EXTENSIONS = [
  {
    id: "py",
    name: "Python",
    publisher: "Microsoft",
    version: "2024.2.0",
    downloads: "102M",
    icon: "https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/python/python.png",
    description:
      "IntelliSense, Linting, Debugging (multi-threaded, remote), Jupyter Notebooks, code formatting, refactoring, unit tests, and more.",
  },
  {
    id: "eslint",
    name: "ESLint",
    publisher: "Microsoft",
    version: "2.4.2",
    downloads: "34M",
    icon: "https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/eslint/eslint.png",
    description: "Integrates ESLint into VS Code.",
  },
  {
    id: "prettier",
    name: "Prettier - Code formatter",
    publisher: "Prettier",
    version: "10.1.0",
    downloads: "42M",
    icon: "https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/prettier/prettier.png",
    description: "Code formatter using prettier",
  },
  {
    id: "copilot",
    name: "TrackCodex AI",
    publisher: "TrackCodex",
    version: "1.143.0",
    downloads: "12M",
    icon: "https://github.githubassets.com/assets/copilot-logo-6c617132848e.svg",
    description: "Your AI pair programmer.",
  },
  {
    id: "docker",
    name: "Docker",
    publisher: "Microsoft",
    version: "1.29.0",
    downloads: "28M",
    icon: "https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/docker/docker.png",
    description:
      "Makes it easy to create, manage, and debug containerized applications.",
  },
];

export const MOCK_FILE_SYSTEM = [
  {
    id: "root",
    name: "track-api-prod",
    type: "folder",
    children: [
      {
        id: "src",
        name: "src",
        type: "folder",
        children: [
          {
            id: "main.cpp",
            name: "main.cpp",
            type: "file",
            language: "cpp",
            content:
              '#include <iostream>\n\nint main() {\n    std::cout << "Hello TrackCodex!" << std::endl;\n    return 0;\n}',
          },
          {
            id: "utils.ts",
            name: "utils.ts",
            type: "file",
            language: "typescript",
            content: "export const add = (a: number, b: number) => a + b;",
          },
          {
            id: "server.go",
            name: "server.go",
            type: "file",
            language: "go",
            content:
              'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Server running...")\n}',
          },
        ],
      },
      {
        id: "README.md",
        name: "README.md",
        type: "file",
        language: "markdown",
        content: "# TrackCodex API\n\nProduction backend service.",
      },
      {
        id: ".gitignore",
        name: ".gitignore",
        type: "file",
        language: "plaintext",
        content: "node_modules\ndist\n.env",
      },
      {
        id: "package.json",
        name: "package.json",
        type: "file",
        language: "json",
        content: '{\n  "name": "track-api",\n  "version": "1.0.0"\n}',
      },
    ],
  },
];
// --- REPOSITORY CONTENT MOCK DATA ---

export const MOCK_REPO_FILES: FileItem[] = [
  {
    name: ".github/workflows",
    type: "dir",
    commitVal: "Update CI pipeline for release",
    time: "2 days ago",
    icon: "folder",
    path: ".github/workflows",
  },
  {
    name: "src",
    type: "dir",
    commitVal: "Refactor auth middleware validation",
    time: "4 hours ago",
    icon: "folder",
    path: "src",
  },
  {
    name: "public",
    type: "dir",
    commitVal: "Add favicon and manifest",
    time: "3 weeks ago",
    icon: "folder",
    path: "public",
  },
  {
    name: "tests",
    type: "dir",
    commitVal: "Add unit tests for user service",
    time: "5 days ago",
    icon: "folder",
    path: "tests",
  },
  {
    name: ".gitignore",
    type: "file",
    commitVal: "Ignore build artifacts",
    time: "2 months ago",
    icon: "file",
    path: ".gitignore",
  },
  {
    name: "LICENSE",
    type: "file",
    commitVal: "Initial commit",
    time: "1 year ago",
    icon: "file",
    path: "LICENSE",
  },
  {
    name: "README.md",
    type: "file",
    commitVal: "Update documentation links",
    time: "1 hour ago",
    icon: "file",
    path: "README.md",
  },
  {
    name: "package.json",
    type: "file",
    commitVal: "Bump version to 2.4.1",
    time: "15 minutes ago",
    icon: "file",
    path: "package.json",
  },
  {
    name: "tsconfig.json",
    type: "file",
    commitVal: "Strict mode enabled",
    time: "6 months ago",
    icon: "file",
    path: "tsconfig.json",
  },
  {
    name: "vite.config.ts",
    type: "file",
    commitVal: "Optimize build chunks",
    time: "1 week ago",
    icon: "file",
    path: "vite.config.ts",
  },
];

export const MOCK_ISSUES = [
  {
    id: 142,
    title: "Authentication fails with 500 on fresh install",
    status: "open",
    author: "jdoe",
    time: "2 hours ago",
    comments: 4,
    labels: [
      { name: "bug", color: "#d73a49" },
      { name: "priority", color: "#b60205" },
    ],
  },
  {
    id: 141,
    title: "Add support for OAuth2 providers",
    status: "open",
    author: "alexcoder",
    time: "5 hours ago",
    comments: 12,
    labels: [{ name: "feature", color: "#a2eeef" }],
  },
  {
    id: 139,
    title: "Memory leak in dashboard component",
    status: "closed",
    author: "sarah_backend",
    time: "yesterday",
    comments: 1,
    labels: [{ name: "bug", color: "#d73a49" }],
  },
];

export const MOCK_PRS = [
  {
    id: 143,
    title: "feat: Add Google Login integration",
    status: "open",
    author: "alexcoder",
    time: "1 hour ago",
    comments: 2,
    checks: "passing",
  },
  {
    id: 140,
    title: "fix: Resolve dashboard memory leak",
    status: "merged",
    author: "sarah_backend",
    time: "yesterday",
    comments: 5,
    checks: "passing",
  },
];

export const MOCK_DISCUSSIONS = [
  {
    id: 1,
    title: "Best practices for state management?",
    category: "Q&A",
    author: "newbie_dev",
    time: "3 days ago",
    replies: 8,
    upvotes: 12,
  },
  {
    id: 2,
    title: "RFC: Plugin Architecture v2",
    category: "Ideas",
    author: "arch_lead",
    time: "1 week ago",
    replies: 24,
    upvotes: 45,
  },
];

