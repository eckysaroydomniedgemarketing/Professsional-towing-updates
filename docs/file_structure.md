# Project File Structure

## Root Configuration
```
├── .claude/
│   ├── .mcp.json                                 — MCP server configuration
│   └── settings.local.json                       — Local Claude settings
├── .env.example                                  — Environment variables template
├── .env.local                                    — Local environment variables
├── .env.local.example                            — Local environment example
├── README.md                                     — 36 lines — Project documentation
├── claude.md                                     — 56 lines — Claude AI instructions
├── components.json                               — 16 lines — shadcn/ui component configuration
├── eslint.config.mjs                             — 16 lines — ESLint configuration
├── next-env.d.ts                                 — 5 lines — Next.js TypeScript declarations
├── next.config.ts                                — 7 lines — Next.js configuration
├── package-lock.json                             — Dependency lock file
├── package.json                                  — 42 lines — Project dependencies and scripts
├── postcss.config.mjs                            — 8 lines — PostCSS configuration
├── tailwind.config.ts                            — 76 lines — Tailwind CSS configuration
├── test-module-1.js                              — 32 lines — Module 1 test script (JavaScript)
├── test-module-1.ts                              — 39 lines — Module 1 test script (TypeScript)
└── tsconfig.json                                 — 27 lines — TypeScript configuration
```

## Source Code (/src)

### App Directory (/src/app)
```
├── app/
│   ├── api/
│   │   └── module-1/
│   │       ├── start-workflow/route.ts           — 46 lines — API endpoint to start RDN workflow
│   │       ├── status/route.ts                   — 32 lines — API endpoint to get workflow status
│   │       └── stop-workflow/route.ts            — 19 lines — API endpoint to stop workflow
│   ├── dashboard/
│   │   └── page.tsx                              — 107 lines — Main dashboard page
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx                          — 21 lines — Clerk sign-in page
│   ├── sso-callback/
│   │   └── page.tsx                              — 24 lines — SSO callback handler
│   ├── globals.css                               — 59 lines — Global CSS styles
│   ├── layout.tsx                                — 38 lines — Root layout component
│   ├── page.module.css                           — 167 lines — Home page module CSS
│   └── page.tsx                                  — 5 lines — Home page component
```

### Components (/src/components)
```
├── components/
│   ├── app-layout/
│   │   ├── app-footer/
│   │   │   └── index.tsx                         — 35 lines — Footer component
│   │   ├── app-header/
│   │   │   ├── index.tsx                         — 29 lines — Header main component
│   │   │   ├── logo-section.tsx                  — 6 lines — Logo section component
│   │   │   ├── mobile-menu.tsx                   — 69 lines — Mobile navigation menu
│   │   │   ├── navigation-section.tsx            — 19 lines — Navigation links component
│   │   │   └── user-section.tsx                  — 56 lines — User profile section
│   │   ├── app-sidebar/
│   │   │   ├── index.tsx                         — 52 lines — Sidebar main component
│   │   │   ├── sidebar-item.tsx                  — 33 lines — Individual sidebar item
│   │   │   └── sidebar-section.tsx               — 16 lines — Sidebar section wrapper
│   │   ├── content-container.tsx                 — 10 lines — Main content wrapper
│   │   └── index.tsx                             — 21 lines — App layout export
│   └── ui/
│       ├── button.tsx                            — 56 lines — Button component
│       ├── progress.tsx                          — 28 lines — Progress bar component
│       └── separator.tsx                         — 30 lines — Separator component
```

### Libraries (/src/lib)
```
├── lib/
│   ├── supabase.ts                               — 7 lines — Supabase client configuration
│   └── utils.ts                                  — 5 lines — Utility functions
```

### Modules (/src/modules)
```
├── modules/
│   ├── auth/
│   │   ├── components/
│   │   │   └── sign-in-form.tsx                 — 163 lines — Sign-in form component
│   │   ├── hooks/
│   │   │   ├── index.ts                         — 0 lines — Hooks export file
│   │   │   └── use-auth.ts                      — 14 lines — Authentication hook
│   │   ├── types/
│   │   │   └── index.ts                         — 12 lines — Auth type definitions
│   │   └── utils/
│   │       ├── auth-helpers.ts                  — 16 lines — Authentication helper functions
│   │       └── index.ts                         — 0 lines — Utils export file
│   └── module-1-rdn-portal/
│       ├── components/
│       │   ├── workflow-control.tsx             — 115 lines — Workflow control interface
│       │   └── workflow-status.tsx              — 66 lines — Workflow status display
│       ├── services/
│       │   └── rdn-portal-service.ts            — 470 lines — RDN portal automation service
│       └── types/
│           └── index.ts                         — 45 lines — Module 1 type definitions
```

### Other (/src)
```
└── middleware.ts                                 — 19 lines — Next.js middleware for auth
```