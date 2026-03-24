# 🚀 TrackCodex (Beta)

**The AI-Powered Developer Platform for High-Performance Teams.**

TrackCodex is an enterprise-grade platform designed to streamline software development through AI-driven insights, modular architecture, and a unified workspace experience. Built with a focus on scalability, security, and developer joy.

![TrackCodex Banner](frontend/public/official-logo.png)

## 🏗️ New Domain-Driven Architecture

The codebase has undergone a comprehensive architectural overhaul, transitioning to a professional, hyper-modular structure:

```bash
trackcodexBeta/
├── 💻 frontend/        # React + Vite UI, Modular Components, Domain Services
├── ⚙️ backend/         # Fastify API, Domain Logic, Security Middleware
├── 🗄️ database/        # Prisma Schema, Migrations, Seed Data
├── 🚀 infrastructure/  # Docker, Terraform, CI/CD Workflows
└── 📜 scripts/         # Automation and Build Utilities
```

## ✨ Key Features

- **ForgeAI Engine**: Advanced AI-powered code analysis and security auditing.
- **Unified Workspace**: Seamlessly start and access cloud workspaces with zero configuration.
- **Rich Activity Tracking**: Gamified social graph for developer contributions and team performance.
- **Enterprise Security**: Role-Based Access Control (RBAC) with granular repository permissions.
- **Desktop & Web**: Optimized for both high-performance desktop (Electron) and responsive web.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [Monaco Editor](https://microsoft.github.io/monaco-editor/).
- **Backend**: [Fastify](https://www.fastify.io/), [Prisma](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/).
- **AI**: [Google Gemini Pro](https://ai.google.dev/).
- **Deployment**: [Railway](https://railway.app/), [Vercel](https://vercel.com/), [GitHub Actions](https://github.com/features/actions).

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker (for local workspace orchestration)
- PostgreSQL (Railway recommended)

### Installation
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate database client
npx prisma generate --schema=backend/schema.prisma

# Start development environment
npm run start:all
```

## 🤝 Contributing

We welcome contributions from the community! Please refer to our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on the new modular architecture, coding standards, and pull request processes.

## 📄 License

This project is licensed under the [LICENSE](LICENSE) provided in this repository.

---

**Built with ❤️ by [somraj-dev](https://github.com/somraj-dev) and the TrackCodex Team.**
