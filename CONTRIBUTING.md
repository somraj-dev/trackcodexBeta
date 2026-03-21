# Contributing to TrackCodex

Welcome to TrackCodex! To help you get started, we've organized our codebase into a clean, professional, and modular structure.

## Directory Structure

### 📁 `frontend/`

All UI-related code resides here.

- `views/`: Divided into feature folders (`repo/`, `workspace/`, `profile/`, etc.).
- `components/`: Consolidated directory containing all UI components, organized by feature (e.g., `components/chat/`, `components/ide/`, `components/layout/`).
- `services/`: API client logic and state services.
- `context/`: React context providers.
- `hooks/`: Custom React hooks.

### 📁 `backend/`

The server-side logic and API routes.

- `routes/`: Express/Fastify API endpoints.
- `services/`: Core logic, divided into domain folders:
  - `git/`: Repository, GitHub, and SCM logic.
  - `workspace/`: Environment management and collaboration.
  - `ai/`: AI orchestration and task runners.
  - `auth/`: Authentication, JWT, and IAM.
  - `activity/`: Audit logs and contribution stats.
  - `infra/`: Internal infrastructure like Database (Prisma), Search, and Redis.

### 📁 `database/`

- Contains Prisma schema and migrations.

### 📁 `infrastructure/`

- DevOps configurations (Docker, Terraform, AWS).

---

## Best Practices

1. **Modularization**: If you add a new feature, create a new folder in `frontend/views` and a corresponding domain folder in `backend/services`.
2. **Imports**: Use standard relative imports. Avoid deep nesting where possible, but follow the domain structure.
3. **Design & Consistency**: Always follow the [Design Guide](file:///c:/Users/HP/TrackcodexBeta/frontend/DESIGN_GUIDE.md).
   - Use theme variables (`bg-gh-bg`, `text-gh-text`) instead of hex codes.
   - Stick to the standardized font scale (base: 14px, small: 13px).
   - Test all new UI in both Light and Dark themes.
4. **Clean Root**: Keep the project root clean. Only configuration files should exist there.
