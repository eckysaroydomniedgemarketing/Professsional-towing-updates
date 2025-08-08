# Project File Structure

```
.
+-- .claude/
|   +-- .mcp.json — 43 lines - MCP server configuration
|   +-- settings.local.json — 43 lines - Local Claude settings
|
+-- public/
|   +-- file.svg — 0 lines - SVG icon for file representation
|   +-- globe.svg — 0 lines - SVG icon for global/internet representation
|   +-- next.svg — 0 lines - Next.js framework logo
|   +-- vercel.svg — 0 lines - Vercel platform logo
|   +-- window.svg — 0 lines - SVG icon for window/browser representation
|
+-- src/
|   +-- app/
|   |   +-- api/
|   |   |   +-- case-processing/
|   |   |   |   +-- analyze-keywords/
|   |   |   |   |   +-- route.ts — 50 lines - API endpoint for keyword analysis
|   |   |   +-- module-1/
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 62 lines - API endpoint to start RDN workflow
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 37 lines - API endpoint for workflow status
|   |   |   |   +-- stop-workflow/
|   |   |   |   |   +-- route.ts — 25 lines - API endpoint to stop workflow
|   |   |   +-- test-openrouter/
|   |   |   |   +-- route.ts — 136 lines - OpenRouter API test endpoint
|   |   +-- case-processing/
|   |   |   +-- page.tsx — 9 lines - Case processing page component
|   |   +-- dashboard/
|   |   |   +-- page.tsx — 107 lines - Main dashboard page
|   |   +-- sign-in/
|   |   |   +-- [[...sign-in]]/
|   |   |   |   +-- page.tsx — 21 lines - Clerk sign-in page
|   |   +-- sso-callback/
|   |   |   +-- page.tsx — 24 lines - SSO callback handler page
|   |   +-- globals.css — 75 lines - Global CSS styles
|   |   +-- layout.tsx — 38 lines - Root layout component
|   |   +-- page.module.css — 167 lines - Page-specific CSS module
|   |   +-- page.tsx — 5 lines - Home page component
|   |
|   +-- components/
|   |   +-- app-layout/
|   |   |   +-- app-footer/
|   |   |   |   +-- index.tsx — 35 lines - Footer component
|   |   |   +-- app-header/
|   |   |   |   +-- index.tsx — 25 lines - Main header component
|   |   |   |   +-- logo-section.tsx — 6 lines - Header logo section
|   |   |   |   +-- mobile-menu.tsx — 69 lines - Mobile menu component
|   |   |   |   +-- navigation-section.tsx — 19 lines - Navigation links section
|   |   |   |   +-- user-section.tsx — 56 lines - User profile section
|   |   |   +-- app-sidebar/
|   |   |   |   +-- index.tsx — 52 lines - Main sidebar component
|   |   |   |   +-- sidebar-item.tsx — 33 lines - Individual sidebar item
|   |   |   |   +-- sidebar-section.tsx — 16 lines - Sidebar section wrapper
|   |   |   +-- content-container.tsx — 10 lines - Main content wrapper
|   |   |   +-- index.tsx — 21 lines - Layout index component
|   |   +-- ui/
|   |   |   +-- alert.tsx — 59 lines - Alert component
|   |   |   +-- badge.tsx — 36 lines - Badge component
|   |   |   +-- button.tsx — 56 lines - Button component
|   |   |   +-- card.tsx — 79 lines - Card component
|   |   |   +-- checkbox.tsx — 30 lines - Checkbox component
|   |   |   +-- input.tsx — 22 lines - Input field component
|   |   |   +-- label.tsx — 26 lines - Label component
|   |   |   +-- progress.tsx — 28 lines - Progress bar component
|   |   |   +-- select.tsx — 160 lines - Select dropdown component
|   |   |   +-- separator.tsx — 30 lines - Separator component
|   |   |   +-- sheet.tsx — 140 lines - Sheet/drawer component
|   |   |   +-- sidebar.tsx — 773 lines - 🔥 > 500 lines - Sidebar navigation component
|   |   |   +-- skeleton.tsx — 15 lines - Skeleton loader component
|   |   |   +-- switch.tsx — 28 lines - Toggle switch component
|   |   |   +-- table.tsx — 116 lines - Table component
|   |   |   +-- textarea.tsx — 22 lines - Textarea component
|   |   |   +-- tooltip.tsx — 30 lines - Tooltip component
|   |
|   +-- lib/
|   |   +-- supabase.ts — 7 lines - Supabase client configuration
|   |   +-- utils.ts — 5 lines - Utility functions
|   |
|   +-- modules/
|   |   +-- auth/
|   |   |   +-- components/
|   |   |   |   +-- sign-in-form.tsx — 164 lines - Sign-in form component
|   |   |   +-- hooks/
|   |   |   |   +-- index.ts — 0 lines - Hooks barrel export
|   |   |   |   +-- use-auth.ts — 14 lines - Authentication hook
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 12 lines - Auth type definitions
|   |   |   +-- utils/
|   |   |   |   +-- auth-helpers.ts — 16 lines - Authentication helper functions
|   |   |   |   +-- index.ts — 0 lines - Utils barrel export
|   |   +-- case-processing/
|   |   |   +-- components/
|   |   |   |   +-- workflow-steps/
|   |   |   |   |   +-- completion-step.tsx — 66 lines - Workflow completion step
|   |   |   |   |   +-- notification-step.tsx — 91 lines - Notification configuration step
|   |   |   |   |   +-- property-verification-step.tsx — 75 lines - Property verification step
|   |   |   |   |   +-- submission-step.tsx — 48 lines - Case submission step
|   |   |   |   |   +-- template-selection-step.tsx — 68 lines - Template selection step
|   |   |   |   |   +-- update-generation-step.tsx — 61 lines - Update generation step
|   |   |   |   |   +-- update-review-step.tsx — 99 lines - Update review step
|   |   |   |   |   +-- validation-step.tsx — 797 lines - 🔥 > 500 lines - Case validation step
|   |   |   |   +-- case-processing-layout.tsx — 273 lines - Case processing layout wrapper
|   |   |   |   +-- workflow-sidebar.tsx — 200 lines - Workflow navigation sidebar
|   |   |   +-- services/
|   |   |   |   +-- agent-update-validation.service.ts — 87 lines - Agent update validation service
|   |   |   |   +-- case-validation.service.ts — 105 lines - Case validation logic
|   |   |   |   +-- keyword-check.service.ts — 95 lines - Keyword checking service
|   |   |   |   +-- openrouter.service.ts — 211 lines - OpenRouter API integration
|   |   |   |   +-- supabase-case.service.ts — 182 lines - Supabase case operations
|   |   |   +-- types/
|   |   |   |   +-- case.types.ts — 74 lines - Case-related type definitions
|   |   |   |   +-- index.ts — 49 lines - Types barrel export
|   |   +-- data-extraction/
|   |   |   +-- services/
|   |   |   |   +-- database.ts — 96 lines - Database service layer
|   |   |   |   +-- supabase.ts — 17 lines - Supabase client service
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 70 lines - Data extraction types
|   |   |   +-- utils/
|   |   |   |   +-- extractors.ts — 395 lines - Data extraction utilities
|   |   |   +-- extractCaseData.ts — 104 lines - Case data extraction logic
|   |   |   +-- index.ts — 2 lines - Module barrel export
|   |   +-- module-1-rdn-portal/
|   |   |   +-- components/
|   |   |   |   +-- workflow-control.tsx — 128 lines - Workflow control panel
|   |   |   |   +-- workflow-status.tsx — 68 lines - Workflow status display
|   |   |   +-- services/
|   |   |   |   +-- auth-manager.service.ts — 124 lines - RDN authentication manager
|   |   |   |   +-- browser-manager.service.ts — 88 lines - Browser automation manager
|   |   |   |   +-- case-processor.service.ts — 374 lines - Case processing automation
|   |   |   |   +-- navigation-manager.service.ts — 200 lines - RDN portal navigation
|   |   |   |   +-- rdn-portal-service.ts — 221 lines - Main RDN portal service
|   |   |   |   +-- workflow-state.service.ts — 35 lines - Workflow state management
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 58 lines - Module type definitions
|   |   |   +-- utils/
|   |   |   |   +-- iframe-helpers.ts — 88 lines - IFrame helper utilities
|   |
|   +-- middleware.ts — 19 lines - Next.js middleware for auth
|
+-- supabase/
|   +-- migrations/
|   |   +-- 20240101000000_create_case_tables.sql — 42 lines - Database schema migration
|
+-- CLAUDE.md — 69 lines - Claude AI project instructions
+-- README.md — 52 lines - Project documentation
+-- components.json — 16 lines - shadcn/ui component configuration
+-- eslint.config.mjs — 16 lines - ESLint configuration
+-- next-env.d.ts — 5 lines - Next.js TypeScript declarations
+-- next.config.ts — 11 lines - Next.js configuration
+-- package-lock.json — 7943 lines - 🔥 > 500 lines - NPM dependency lock file
+-- package.json — 50 lines - NPM package configuration
+-- postcss.config.mjs — 8 lines - PostCSS configuration
+-- tailwind.config.ts — 94 lines - Tailwind CSS configuration
+-- tsconfig.json — 27 lines - TypeScript configuration
```