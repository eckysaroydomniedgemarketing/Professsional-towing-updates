# Project File Structure

```
+-- public/
|   +-- file.svg — 0 lines - SVG icon for file representation
|   +-- globe.svg — 0 lines - SVG icon for global/world representation
|   +-- next.svg — 0 lines - Next.js framework logo
|   +-- vercel.svg — 0 lines - Vercel platform logo
|   +-- window.svg — 0 lines - SVG icon for window/browser representation
|
+-- src/
|   +-- app/
|   |   +-- agent-updates-visibility/
|   |   |   +-- page.tsx — 192 lines - Agent visibility dashboard page
|   |   |
|   |   +-- api/
|   |   |   +-- case-processing/
|   |   |   |   +-- analyze-keywords/
|   |   |   |       +-- route.ts — 50 lines - API endpoint for keyword analysis
|   |   |   |
|   |   |   +-- module-1/
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 88 lines - API to start module 1 workflow
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 39 lines - API to check workflow status
|   |   |   |   +-- stop-workflow/
|   |   |   |       +-- route.ts — 25 lines - API to stop workflow
|   |   |   |
|   |   |   +-- module-4/
|   |   |   |   +-- delete-log/
|   |   |   |   |   +-- route.ts — 31 lines - API to delete log entries
|   |   |   |   +-- export-report/
|   |   |   |   |   +-- route.ts — 143 lines - API to export visibility reports
|   |   |   |   +-- health/
|   |   |   |   |   +-- route.ts — 50 lines - API health check endpoint
|   |   |   |   +-- process-case/
|   |   |   |   |   +-- route.ts — 55 lines - API to process individual case
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 117 lines - API to start module 4 workflow
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 67 lines - API to check module 4 status
|   |   |   |   +-- stop-workflow/
|   |   |   |       +-- route.ts — 39 lines - API to stop module 4 workflow
|   |   |   |
|   |   |   +-- test-openrouter/
|   |   |       +-- route.ts — 136 lines - API endpoint for OpenRouter testing
|   |   |
|   |   +-- case-processing/
|   |   |   +-- page.tsx — 9 lines - Case processing main page
|   |   |
|   |   +-- dashboard/
|   |   |   +-- page.tsx — 107 lines - Main dashboard page with workflow controls
|   |   |
|   |   +-- sign-in/
|   |   |   +-- [[...sign-in]]/
|   |   |       +-- page.tsx — 21 lines - Sign-in page with Clerk integration
|   |   |
|   |   +-- sso-callback/
|   |   |   +-- page.tsx — 24 lines - SSO callback handler page
|   |   |
|   |   +-- globals.css — 75 lines - Global application styles
|   |   +-- layout.tsx — 38 lines - Root application layout
|   |   +-- page.module.css — 167 lines - Homepage module styles
|   |   +-- page.tsx — 5 lines - Homepage component
|   |
|   +-- components/
|   |   +-- app-layout/
|   |   |   +-- app-footer/
|   |   |   |   +-- index.tsx — 35 lines - Application footer component
|   |   |   |
|   |   |   +-- app-header/
|   |   |   |   +-- index.tsx — 25 lines - Main header component
|   |   |   |   +-- logo-section.tsx — 6 lines - Header logo section
|   |   |   |   +-- mobile-menu.tsx — 69 lines - Mobile navigation menu
|   |   |   |   +-- navigation-section.tsx — 19 lines - Header navigation links
|   |   |   |   +-- user-section.tsx — 56 lines - User profile section
|   |   |   |
|   |   |   +-- app-sidebar/
|   |   |   |   +-- index.tsx — 52 lines - Main sidebar component
|   |   |   |   +-- sidebar-item.tsx — 33 lines - Individual sidebar item
|   |   |   |   +-- sidebar-section.tsx — 16 lines - Sidebar section wrapper
|   |   |   |
|   |   |   +-- content-container.tsx — 10 lines - Main content wrapper
|   |   |   +-- index.tsx — 21 lines - App layout export
|   |   |
|   |   +-- ui/
|   |       +-- sidebar/
|   |       |   +-- index.tsx — 29 lines - Sidebar UI exports
|   |       |   +-- sidebar-components.tsx — 193 lines - Sidebar component collection
|   |       |   +-- sidebar-content.tsx — 163 lines - Sidebar content wrapper
|   |       |   +-- sidebar-menu.tsx — 267 lines - Sidebar menu system
|   |       |   +-- sidebar-provider.tsx — 144 lines - Sidebar context provider
|   |       |
|   |       +-- alert.tsx — 59 lines - Alert component
|   |       +-- badge.tsx — 36 lines - Badge component
|   |       +-- button.tsx — 56 lines - Button component
|   |       +-- card.tsx — 79 lines - Card component
|   |       +-- checkbox.tsx — 30 lines - Checkbox component
|   |       +-- input.tsx — 22 lines - Input field component
|   |       +-- label.tsx — 26 lines - Label component
|   |       +-- progress.tsx — 28 lines - Progress bar component
|   |       +-- select.tsx — 160 lines - Select dropdown component
|   |       +-- separator.tsx — 30 lines - Separator component
|   |       +-- sheet.tsx — 140 lines - Sheet/drawer component
|   |       +-- sidebar.tsx — 1 lines - Sidebar re-export
|   |       +-- skeleton.tsx — 15 lines - Skeleton loader component
|   |       +-- switch.tsx — 28 lines - Toggle switch component
|   |       +-- table.tsx — 116 lines - Table component
|   |       +-- textarea.tsx — 22 lines - Textarea component
|   |       +-- tooltip.tsx — 30 lines - Tooltip component
|   |
|   +-- lib/
|   |   +-- supabase.ts — 7 lines - Supabase client configuration
|   |   +-- utils.ts — 5 lines - Utility functions
|   |
|   +-- modules/
|   |   +-- auth/
|   |   |   +-- components/
|   |   |   |   +-- sign-in-form.tsx — 164 lines - Sign-in form component
|   |   |   |
|   |   |   +-- hooks/
|   |   |   |   +-- index.ts — 0 lines - Hooks exports
|   |   |   |   +-- use-auth.ts — 14 lines - Authentication hook
|   |   |   |
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 12 lines - Auth type definitions
|   |   |   |
|   |   |   +-- utils/
|   |   |       +-- auth-helpers.ts — 16 lines - Authentication helper functions
|   |   |       +-- index.ts — 0 lines - Utils exports
|   |   |
|   |   +-- case-processing/
|   |   |   +-- components/
|   |   |   |   +-- update-assistant/
|   |   |   |   |   +-- address-list.tsx — 71 lines - Address list component
|   |   |   |   |   +-- draft-section.tsx — 155 lines - Update draft section
|   |   |   |   |   +-- index.tsx — 390 lines - Update assistant main component
|   |   |   |   |   +-- last-update.tsx — 101 lines - Last update display
|   |   |   |   |
|   |   |   |   +-- validation/
|   |   |   |   |   +-- validation-keyword-analysis.tsx — 174 lines - Keyword validation component
|   |   |   |   |   +-- validation-order-status.tsx — 76 lines - Order status validation
|   |   |   |   |   +-- validation-zipcode.tsx — 90 lines - Zipcode validation component
|   |   |   |   |
|   |   |   |   +-- validation-sections/
|   |   |   |   |   +-- agent-update-section.tsx — 80 lines - Agent update validation section
|   |   |   |   |   +-- auto-skip-countdown.tsx — 16 lines - Auto-skip countdown component
|   |   |   |   |   +-- client-exclusion-section.tsx — 59 lines - Client exclusion check section
|   |   |   |   |   +-- user-update-section.tsx — 85 lines - User update validation section
|   |   |   |   |   +-- validation-result-alert.tsx — 58 lines - Validation result alert component
|   |   |   |   |
|   |   |   |   +-- workflow-steps/
|   |   |   |   |   +-- completion-step.tsx — 66 lines - Workflow completion step
|   |   |   |   |   +-- notification-step.tsx — 91 lines - Notification step component
|   |   |   |   |   +-- property-verification-step.tsx — 75 lines - Property verification step
|   |   |   |   |   +-- submission-step.tsx — 48 lines - Submission step component
|   |   |   |   |   +-- template-selection-step.tsx — 68 lines - Template selection step
|   |   |   |   |   +-- update-generation-step.tsx — 61 lines - Update generation step
|   |   |   |   |   +-- update-history-display.tsx — 163 lines - Update history display
|   |   |   |   |   +-- update-review-step.tsx — 99 lines - Update review step
|   |   |   |   |   +-- validation-step.tsx — 185 lines - Validation step component
|   |   |   |   |
|   |   |   |   +-- case-processing-layout.tsx — 331 lines - Case processing layout
|   |   |   |   +-- workflow-sidebar.tsx — 186 lines - Workflow sidebar component
|   |   |   |
|   |   |   +-- hooks/
|   |   |   |   +-- use-auto-skip.ts — 43 lines - Auto-skip logic hook
|   |   |   |   +-- use-keyword-analysis.ts — 192 lines - Keyword analysis hook
|   |   |   |   +-- use-validation-logic.ts — 51 lines - Validation logic hook
|   |   |   |
|   |   |   +-- services/
|   |   |   |   +-- agent-update-validation.service.ts — 87 lines - Agent update validation
|   |   |   |   +-- case-validation.service.ts — 167 lines - Case validation service
|   |   |   |   +-- client-exclusion.service.ts — 93 lines - Client exclusion logic
|   |   |   |   +-- keyword-check.service.ts — 95 lines - Keyword checking service
|   |   |   |   +-- openrouter.service.ts — 211 lines - OpenRouter API service
|   |   |   |   +-- post-update.service.ts — 49 lines - Post update service
|   |   |   |   +-- supabase-case.service.ts — 365 lines - Supabase case operations
|   |   |   |   +-- template.service.ts — 79 lines - Template management service
|   |   |   |   +-- update-poster.service.ts — 386 lines - Update posting service
|   |   |   |   +-- validation-logic.service.ts — 100 lines - Validation logic service
|   |   |   |
|   |   |   +-- types/
|   |   |       +-- case.types.ts — 90 lines - Case type definitions
|   |   |       +-- index.ts — 46 lines - Type exports
|   |   |
|   |   +-- data-extraction/
|   |   |   +-- services/
|   |   |   |   +-- database.ts — 144 lines - Database operations service
|   |   |   |   +-- supabase.ts — 17 lines - Supabase client service
|   |   |   |
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 72 lines - Data extraction types
|   |   |   |
|   |   |   +-- utils/
|   |   |   |   +-- extractors.ts — 435 lines - Data extraction utilities
|   |   |   |
|   |   |   +-- extractCaseData.ts — 174 lines - Case data extraction logic
|   |   |   +-- index.ts — 2 lines - Module exports
|   |   |
|   |   +-- module-1-rdn-portal/
|   |   |   +-- components/
|   |   |   |   +-- workflow-control.tsx — 212 lines - Workflow control component
|   |   |   |   +-- workflow-status.tsx — 88 lines - Workflow status display
|   |   |   |
|   |   |   +-- services/
|   |   |   |   +-- auth-manager.service.ts — 124 lines - Authentication manager
|   |   |   |   +-- browser-manager.service.ts — 168 lines - Browser automation service
|   |   |   |   +-- case-navigation.service.ts — 303 lines - Case navigation service
|   |   |   |   +-- case-processor.service.ts — 369 lines - Case processing service
|   |   |   |   +-- navigation-manager.service.ts — 232 lines - Navigation management
|   |   |   |   +-- portal-auth-workflow.service.ts — 53 lines - Portal auth workflow
|   |   |   |   +-- portal-navigation-workflow.service.ts — 138 lines - Portal navigation workflow
|   |   |   |   +-- rdn-portal-service.ts — 182 lines - RDN portal main service
|   |   |   |   +-- workflow-executor.service.ts — 148 lines - Workflow executor service
|   |   |   |   +-- workflow-state.service.ts — 44 lines - Workflow state management
|   |   |   |
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 61 lines - Module type definitions
|   |   |   |
|   |   |   +-- utils/
|   |   |       +-- iframe-helpers.ts — 88 lines - IFrame helper utilities
|   |   |
|   |   +-- module-4-agent-visibility/
|   |       +-- components/
|   |       |   +-- current-processing.tsx — 89 lines - Current processing display
|   |       |   +-- empty-state.tsx — 27 lines - Empty state component
|   |       |   +-- report-table.tsx — 113 lines - Report table component
|   |       |   +-- statistics-display.tsx — 66 lines - Statistics display component
|   |       |   +-- workflow-control.tsx — 112 lines - Workflow control panel
|   |       |
|   |       +-- hooks/
|   |       |   +-- use-workflow.ts — 279 lines - Workflow management hook
|   |       |
|   |       +-- services/
|   |       |   +-- api-client.service.ts — 197 lines - API client service
|   |       |   +-- case-navigation.service.ts — 106 lines - Case navigation service
|   |       |   +-- protocol-buttons.service.ts — 119 lines - Protocol button handling service
|   |       |   +-- rdn-visibility.service.ts — 208 lines - RDN visibility orchestrator service
|   |       |   +-- supabase-server.service.ts — 37 lines - Supabase server service
|   |       |   +-- update-discovery.service.ts — 157 lines - Update discovery service
|   |       |   +-- visibility-log.service.ts — 278 lines - Visibility logging service
|   |       |   +-- visibility-toggle.service.ts — 291 lines - Visibility toggling service
|   |       |   +-- workflow-manager.service.ts — 287 lines - Workflow management service
|   |       |
|   |       +-- types/
|   |       |   +-- index.ts — 99 lines - Module type definitions
|   |       |
|   |       +-- utils/
|   |           +-- csv-export.utils.ts — 82 lines - CSV export utilities
|   |           +-- error-handler.ts — 37 lines - Error handling utilities
|   |           +-- pdf-export.utils.ts — 79 lines - PDF export utilities
|   |
|   +-- middleware.ts — 19 lines - Next.js middleware configuration
|
+-- supabase/
|   +-- migrations/
|       +-- 20240101000000_create_case_tables.sql — 42 lines - Database migration for case tables
|
+-- CLAUDE.md — 74 lines - Claude AI assistant instructions
+-- README.md — 162 lines - Project documentation
+-- components.json — 16 lines - shadcn/ui component configuration
+-- eslint.config.mjs — 16 lines - ESLint configuration
+-- next-env.d.ts — 5 lines - Next.js type definitions
+-- next.config.ts — 11 lines - Next.js configuration
+-- package-lock.json — 🔥 8274 lines - NPM package lock file
+-- package.json — 54 lines - NPM package configuration
+-- postcss.config.mjs — 8 lines - PostCSS configuration
+-- tailwind.config.ts — 94 lines - Tailwind CSS configuration
+-- tsconfig.json — 27 lines - TypeScript configuration
```