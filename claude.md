# CLAUDE.md

This file guides Claude Code when working with this repository.

## Project Overview
- Concise web application for streamlining workflows
- MVP/POC level: focus on core functionality, avoid over-engineering
- Prioritize working prototype over perfection

## Tech Stack
- **Frontend**: Next.js (React)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Auth**: Clerk.com
- **Backend/DB**: Supabase

## Architecture
Feature-based modular structure:
```
src/
├── modules/           # Feature modules (auth, feature-1, etc.)
├── pages/             # Next.js pages
├── lib/               # Core libraries
└── public/            # Static assets
```

Each module contains:
- components/ - UI components
- hooks/ - React hooks
- services/ - API/data services
- types/ - Type definitions
- utils/ - Utility functions

## Module Independence
- Module-specific implementation for most code
- Minimal shared utilities (auth/DB only)
- No shared UI components
- Strong module boundaries

## Development Guidelines
1. **Organization**: Logical grouping, clear structure, separation of concerns
2. **Naming**: Descriptive, consistent, language-appropriate
3. **Components**: Use shadcn/ui, install with `npx shadcn-ui@latest add [component]`
4. **Styling**: Use Tailwind, avoid custom CSS
5. **Theming**: Follow components.json config, maintain design consistency
6. **Size**: Keep files under 500 lines, follow single responsibility principle

## shadcn/ui Usage
- Components installed in `components/ui/` directory
- Customize while maintaining design system consistency
- Use Tailwind for styling within the theme config
- Follow accessibility standards

## Shared Code Policy
- Essential utilities only in shared directories
- Keep module code within its module
- No shared UI components between modules
- Each module evolves independently