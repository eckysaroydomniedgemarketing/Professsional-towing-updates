# Project File Structure

```
+-- .claude/
|   +-- .mcp.json — MCP configuration for Claude
|   +-- settings.local.json — Local Claude settings
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
|   |   +-- agent-updates-visibility/
|   |   |   +-- page.tsx — 182 lines - Agent visibility dashboard page
|   |   +-- api/
|   |   |   +-- case-processing/
|   |   |   |   +-- analyze-keywords/
|   |   |   |   |   +-- route.ts — 50 lines - API endpoint for keyword analysis
|   |   |   +-- module-1/
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 88 lines - API to start Module 1 workflow
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 39 lines - API to check workflow status
|   |   |   |   +-- stop-workflow/
|   |   |   |   |   +-- route.ts — 25 lines - API to stop workflow
|   |   |   +-- module-4/
|   |   |   |   +-- delete-log/
|   |   |   |   |   +-- route.ts — 31 lines - API to delete visibility logs
|   |   |   |   +-- export-report/
|   |   |   |   |   +-- route.ts — 143 lines - API to export visibility reports
|   |   |   |   +-- health/
|   |   |   |   |   +-- route.ts — 50 lines - Health check endpoint
|   |   |   |   +-- process-case/
|   |   |   |   |   +-- route.ts — 55 lines - API to process case
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 117 lines - API to start Module 4 workflow
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 67 lines - API to check Module 4 status
|   |   |   |   +-- stop-workflow/
|   |   |   |   |   +-- route.ts — 39 lines - API to stop Module 4 workflow
|   |   |   +-- test-openrouter/
|   |   |   |   +-- route.ts — 136 lines - Test endpoint for OpenRouter API
|   |   +-- case-processing/
|   |   |   +-- page.tsx — 9 lines - Case processing main page
|   |   +-- dashboard/
|   |   |   +-- page.tsx — 107 lines - Main dashboard page
|   |   +-- sign-in/
|   |   |   +-- [[...sign-in]]/
|   |   |   |   +-- page.tsx — 21 lines - Sign-in page with Clerk
|   |   +-- sso-callback/
|   |   |   +-- page.tsx — 24 lines - SSO callback handler page
|   |   +-- globals.css — 75 lines - Global CSS styles
|   |   +-- layout.tsx — 38 lines - Root layout component
|   |   +-- page.module.css — 167 lines - Page-specific CSS module
|   |   +-- page.tsx — 5 lines - Landing page component
|   +-- components/
|   |   +-- app-layout/
|   |   |   +-- app-footer/
|   |   |   |   +-- index.tsx — 35 lines - Application footer component
|   |   |   +-- app-header/
|   |   |   |   +-- index.tsx — 25 lines - Application header component
|   |   |   |   +-- logo-section.tsx — 6 lines - Logo section component
|   |   |   |   +-- mobile-menu.tsx — 69 lines - Mobile menu component
|   |   |   |   +-- navigation-section.tsx — 19 lines - Navigation links component
|   |   |   |   +-- user-section.tsx — 56 lines - User profile section
|   |   |   +-- app-sidebar/
|   |   |   |   +-- index.tsx — 52 lines - Application sidebar component
|   |   |   |   +-- sidebar-item.tsx — 33 lines - Individual sidebar item
|   |   |   |   +-- sidebar-section.tsx — 16 lines - Sidebar section wrapper
|   |   |   +-- content-container.tsx — 10 lines - Main content container
|   |   |   +-- index.tsx — 21 lines - App layout main export
|   |   +-- ui/
|   |   |   +-- sidebar/
|   |   |   |   +-- index.tsx — 1 lines - Main export (maintains backward compatibility)
|   |   |   |   +-- sidebar-container.tsx — NEW - Container component
|   |   |   |   +-- sidebar-content.tsx — 163 lines - Content wrapper component
|   |   |   |   +-- sidebar-footer.tsx — NEW - Footer section component
|   |   |   |   +-- sidebar-header.tsx — NEW - Header section component
|   |   |   |   +-- sidebar-components.tsx — 193 lines - Sidebar sub-components
|   |   |   |   +-- sidebar-menu.tsx — 267 lines - Sidebar menu implementation
|   |   |   |   +-- sidebar-provider.tsx — 144 lines - Sidebar context provider
|   |   |   +-- alert.tsx — 59 lines - Alert UI component
|   |   |   +-- badge.tsx — 36 lines - Badge UI component
|   |   |   +-- button.tsx — 56 lines - Button UI component
|   |   |   +-- card.tsx — 79 lines - Card UI component
|   |   |   +-- checkbox.tsx — 30 lines - Checkbox UI component
|   |   |   +-- input.tsx — 22 lines - Input field component
|   |   |   +-- label.tsx — 26 lines - Label UI component
|   |   |   +-- progress.tsx — 28 lines - Progress bar component
|   |   |   +-- select.tsx — 160 lines - Select dropdown component
|   |   |   +-- separator.tsx — 30 lines - Separator UI component
|   |   |   +-- sheet.tsx — 140 lines - Sheet/drawer component
|   |   |   +-- sidebar.tsx — 1 lines - Sidebar export file (re-exports from sidebar/ directory)
|   |   |   +-- skeleton.tsx — 15 lines - Skeleton loader component
|   |   |   +-- switch.tsx — 28 lines - Toggle switch component
|   |   |   +-- table.tsx — 116 lines - Table UI component
|   |   |   +-- textarea.tsx — 22 lines - Textarea component
|   |   |   +-- tooltip.tsx — 30 lines - Tooltip UI component
|   +-- lib/
|   |   +-- supabase.ts — 7 lines - Supabase client configuration
|   |   +-- utils.ts — 5 lines - Utility functions
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
|   |   |   |   +-- update-assistant/
|   |   |   |   |   +-- address-list.tsx — 71 lines - Address list display component
|   |   |   |   |   +-- draft-section.tsx — 155 lines - Update draft section
|   |   |   |   |   +-- index.tsx — 390 lines - Update assistant main component
|   |   |   |   |   +-- last-update.tsx — 97 lines - Last update display
|   |   |   |   +-- validation/
|   |   |   |   |   +-- validation-keyword-analysis.tsx — 174 lines - Keyword validation component
|   |   |   |   |   +-- validation-order-status.tsx — 76 lines - Order status validation
|   |   |   |   |   +-- validation-zipcode.tsx — 90 lines - Zipcode validation component
|   |   |   |   +-- workflow-steps/
|   |   |   |   |   +-- validation-step/
|   |   |   |   |   |   +-- case-data-display.tsx — NEW - Case information display
|   |   |   |   |   |   +-- validation-checks.tsx — NEW - Validation criteria checks
|   |   |   |   |   |   +-- update-history-analysis.tsx — NEW - Update history table
|   |   |   |   |   |   +-- user-update-check.tsx — NEW - User update detection
|   |   |   |   |   |   +-- auto-skip-countdown.tsx — NEW - Countdown timer component
|   |   |   |   |   +-- completion-step.tsx — 66 lines - Workflow completion step
|   |   |   |   |   +-- notification-step.tsx — 91 lines - Notification step component
|   |   |   |   |   +-- property-verification-step.tsx — 75 lines - Property verification step
|   |   |   |   |   +-- submission-step.tsx — 48 lines - Submission step component
|   |   |   |   |   +-- template-selection-step.tsx — 68 lines - Template selection step
|   |   |   |   |   +-- update-generation-step.tsx — 61 lines - Update generation step
|   |   |   |   |   +-- update-history-display.tsx — 163 lines - Update history display
|   |   |   |   |   +-- update-review-step.tsx — 99 lines - Update review step
|   |   |   |   |   +-- validation-step.tsx — 542 lines - Main validation orchestrator
|   |   |   |   +-- case-processing-layout.tsx — 345 lines - Case processing page layout
|   |   |   |   +-- workflow-sidebar.tsx — 171 lines - Workflow sidebar navigation
|   |   |   +-- services/
|   |   |   |   +-- agent-update-validation.service.ts — 87 lines - Agent update validation logic
|   |   |   |   +-- case-validation.service.ts — 150 lines - Case validation service
|   |   |   |   +-- keyword-check.service.ts — 95 lines - Keyword checking service
|   |   |   |   +-- openrouter.service.ts — 211 lines - OpenRouter API service
|   |   |   |   +-- post-update.service.ts — 49 lines - Post update service
|   |   |   |   +-- supabase-case.service.ts — 365 lines - Supabase case operations
|   |   |   |   +-- template.service.ts — 79 lines - Template management service
|   |   |   |   +-- update-poster.service.ts — 386 lines - Update posting service
|   |   |   |   +-- validation-logic.service.ts — 100 lines - Validation logic service
|   |   |   +-- types/
|   |   |   |   +-- case.types.ts — 86 lines - Case type definitions
|   |   |   |   +-- index.ts — 46 lines - Type exports
|   |   +-- data-extraction/
|   |   |   +-- services/
|   |   |   |   +-- database.ts — 144 lines - Database operations service
|   |   |   |   +-- supabase.ts — 17 lines - Supabase integration
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 72 lines - Data extraction types
|   |   |   +-- utils/
|   |   |   |   +-- extractors.ts — 435 lines - Data extraction utilities
|   |   |   +-- extractCaseData.ts — 174 lines - Case data extraction logic
|   |   |   +-- index.ts — 2 lines - Module export
|   |   +-- module-1-rdn-portal/
|   |   |   +-- components/
|   |   |   |   +-- workflow-control.tsx — 208 lines - Workflow control component
|   |   |   |   +-- workflow-status.tsx — 88 lines - Workflow status display
|   |   |   +-- services/
|   |   |   |   +-- auth-manager.service.ts — 124 lines - Authentication manager
|   |   |   |   +-- browser-manager.service.ts — 168 lines - Browser automation manager
|   |   |   |   +-- case-processor.service.ts — 369 lines - Case processing service
|   |   |   |   +-- navigation-manager.service.ts — 200 lines - Navigation management
|   |   |   |   +-- rdn-portal-service.ts — 470 lines - RDN portal integration
|   |   |   |   +-- workflow-state.service.ts — 44 lines - Workflow state management
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 61 lines - Module 1 type definitions
|   |   |   +-- utils/
|   |   |   |   +-- iframe-helpers.ts — 88 lines - Iframe utility functions
|   |   +-- module-4-agent-visibility/
|   |   |   +-- components/
|   |   |   |   +-- current-processing.tsx — 89 lines - Current processing display
|   |   |   |   +-- empty-state.tsx — 27 lines - Empty state component
|   |   |   |   +-- report-table.tsx — 100 lines - Report table component
|   |   |   |   +-- statistics-display.tsx — 66 lines - Statistics display component
|   |   |   |   +-- workflow-control.tsx — 112 lines - Workflow control panel
|   |   |   +-- hooks/
|   |   |   |   +-- use-workflow.ts — 254 lines - Workflow hook
|   |   |   +-- services/
|   |   |   |   +-- api-client.service.ts — 197 lines - API client service
|   |   |   |   +-- rdn-visibility.service.ts — 492 lines - RDN visibility service
|   |   |   |   +-- supabase-server.service.ts — 37 lines - Supabase server service
|   |   |   |   +-- visibility-log.service.ts — 268 lines - Visibility logging service
|   |   |   |   +-- workflow-manager.service.ts — 281 lines - Workflow management service
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 72 lines - Module 4 type definitions
|   |   |   +-- utils/
|   |   |   |   +-- csv-export.utils.ts — 82 lines - CSV export utilities
|   |   |   |   +-- error-handler.ts — 37 lines - Error handling utilities
|   +-- middleware.ts — 19 lines - Next.js middleware configuration
|
+-- supabase/
|   +-- migrations/
|   |   +-- 20240101000000_create_case_tables.sql — 42 lines - Database migration for case tables
|
+-- CLAUDE.md — 69 lines - Claude AI instructions and guidelines
+-- README.md — 52 lines - Project documentation
+-- components.json — 16 lines - shadcn/ui components configuration
+-- eslint.config.mjs — 16 lines - ESLint configuration
+-- next-env.d.ts — 5 lines - Next.js TypeScript definitions
+-- next.config.ts — 11 lines - Next.js configuration
+-- package-lock.json — 🔥 > 500 lines - NPM dependency lock file
+-- package.json — 52 lines - Project dependencies and scripts
+-- postcss.config.mjs — 8 lines - PostCSS configuration
+-- tailwind.config.ts — 94 lines - Tailwind CSS configuration
+-- tsconfig.json — 27 lines - TypeScript configuration
```