# Project File Structure

+-- .claude/
|   +-- .mcp.json — 43 lines — MCP server configuration for Claude
|   +-- settings.local.json — 44 lines — Local Claude settings
|
+-- public/
|   +-- file.svg — 0 lines — SVG icon for file representation
|   +-- globe.svg — 0 lines — SVG icon for global/internet representation  
|   +-- next.svg — 0 lines — Next.js framework logo
|   +-- vercel.svg — 0 lines — Vercel platform logo
|   +-- window.svg — 0 lines — SVG icon for window/browser representation
|
+-- src/
|   +-- app/
|   |   +-- agent-updates-visibility/
|   |   |   +-- page.tsx — 206 lines — Agent updates visibility page component
|   |   +-- api/
|   |   |   +-- billing-data/
|   |   |   |   +-- route.ts — 35 lines — Billing data API endpoint
|   |   |   +-- billing-workflow/
|   |   |   |   +-- route.ts — 50 lines — Billing workflow API endpoint
|   |   |   +-- case-processing/
|   |   |   |   +-- analyze-keywords/
|   |   |   |   |   +-- route.ts — 50 lines — Keyword analysis API endpoint
|   |   |   |   +-- post-update/
|   |   |   |   |   +-- route.ts — 90 lines — Post update submission API endpoint
|   |   |   +-- extract-invoices/
|   |   |   |   +-- route.ts — 43 lines — Invoice extraction API endpoint
|   |   |   +-- invoice-data/
|   |   |   |   +-- route.ts — 43 lines — Invoice data management API endpoint
|   |   |   +-- module-1/
|   |   |   |   +-- select-page/
|   |   |   |   |   +-- route.ts — 74 lines — Page selection API endpoint
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 88 lines — Start workflow API endpoint
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 49 lines — Workflow status API endpoint
|   |   |   |   +-- stop-workflow/
|   |   |   |   |   +-- route.ts — 25 lines — Stop workflow API endpoint
|   |   |   +-- module-4/
|   |   |   |   +-- delete-log/
|   |   |   |   |   +-- route.ts — 31 lines — Delete log entry API endpoint
|   |   |   |   +-- export-report/
|   |   |   |   |   +-- route.ts — 143 lines — Export report API endpoint
|   |   |   |   +-- health/
|   |   |   |   |   +-- route.ts — 50 lines — Health check API endpoint
|   |   |   |   +-- process-case/
|   |   |   |   |   +-- route.ts — 55 lines — Process case API endpoint
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 117 lines — Start visibility workflow API
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 67 lines — Workflow status API endpoint
|   |   |   |   +-- stop-workflow/
|   |   |   |   |   +-- route.ts — 39 lines — Stop workflow API endpoint
|   |   |   +-- module-5/
|   |   |   |   +-- continue/
|   |   |   |   |   +-- route.ts — 30 lines — Continue workflow API endpoint
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 115 lines — Start on-hold workflow API
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 37 lines — Workflow status API endpoint
|   |   |   |   +-- stop/
|   |   |   |   |   +-- route.ts — 30 lines — Stop workflow API endpoint
|   |   |   +-- module-6/
|   |   |   |   +-- continue/
|   |   |   |   |   +-- route.ts — 30 lines — Continue workflow API endpoint
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 115 lines — Start pending-close workflow API
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 37 lines — Workflow status API endpoint
|   |   |   |   +-- stop/
|   |   |   |   |   +-- route.ts — 30 lines — Stop workflow API endpoint
|   |   |   +-- test-openrouter/
|   |   |   |   +-- route.ts — 136 lines — OpenRouter API test endpoint
|   |   +-- billing/
|   |   |   +-- page.tsx — 4 lines — Billing page component
|   |   +-- case-processing/
|   |   |   +-- page.tsx — 9 lines — Case processing page component
|   |   +-- dashboard/
|   |   |   +-- page.tsx — 293 lines — Main dashboard page component
|   |   +-- on-hold/
|   |   |   +-- page.tsx — 4 lines — On-hold cases page component
|   |   +-- pending-close/
|   |   |   +-- page.tsx — 4 lines — Pending close cases page component
|   |   +-- sign-in/
|   |   |   +-- [[...sign-in]]/
|   |   |   |   +-- page.tsx — 21 lines — Dynamic sign-in page component
|   |   +-- sso-callback/
|   |   |   +-- page.tsx — 24 lines — SSO callback handler page
|   |   +-- favicon.ico — 30 lines — Application favicon
|   |   +-- globals.css — 75 lines — Global CSS styles
|   |   +-- layout.tsx — 38 lines — Root layout component
|   |   +-- page.module.css — 167 lines — Page-specific CSS module
|   |   +-- page.tsx — 5 lines — Home page component
|   +-- components/
|   |   +-- app-layout/
|   |   |   +-- app-footer/
|   |   |   |   +-- index.tsx — 35 lines — Footer component
|   |   |   +-- app-header/
|   |   |   |   +-- index.tsx — 25 lines — Header main component
|   |   |   |   +-- logo-section.tsx — 6 lines — Logo section component
|   |   |   |   +-- mobile-menu.tsx — 69 lines — Mobile menu component
|   |   |   |   +-- navigation-section.tsx — 19 lines — Navigation section component
|   |   |   |   +-- user-section.tsx — 56 lines — User section component
|   |   |   +-- app-sidebar/
|   |   |   |   +-- index.tsx — 37 lines — Sidebar main component
|   |   |   |   +-- sidebar-item.tsx — 33 lines — Sidebar item component
|   |   |   |   +-- sidebar-section.tsx — 16 lines — Sidebar section component
|   |   |   +-- content-container.tsx — 10 lines — Content container wrapper
|   |   |   +-- index.tsx — 21 lines — App layout main component
|   |   +-- ui/
|   |   |   +-- sidebar/
|   |   |   |   +-- index.tsx — 29 lines — Sidebar exports
|   |   |   |   +-- sidebar-components.tsx — 193 lines — Sidebar sub-components
|   |   |   |   +-- sidebar-content.tsx — 163 lines — Sidebar content component
|   |   |   |   +-- sidebar-menu.tsx — 267 lines — Sidebar menu component
|   |   |   |   +-- sidebar-provider.tsx — 144 lines — Sidebar context provider
|   |   |   +-- alert.tsx — 59 lines — Alert component
|   |   |   +-- badge.tsx — 36 lines — Badge component
|   |   |   +-- button.tsx — 56 lines — Button component
|   |   |   +-- card.tsx — 79 lines — Card component
|   |   |   +-- checkbox.tsx — 30 lines — Checkbox component
|   |   |   +-- input.tsx — 22 lines — Input component
|   |   |   +-- label.tsx — 26 lines — Label component
|   |   |   +-- progress.tsx — 28 lines — Progress bar component
|   |   |   +-- radio-group.tsx — 44 lines — Radio group component
|   |   |   +-- select.tsx — 160 lines — Select dropdown component
|   |   |   +-- separator.tsx — 30 lines — Separator component
|   |   |   +-- sheet.tsx — 140 lines — Sheet/drawer component
|   |   |   +-- sidebar.tsx — 1 lines — Sidebar re-export
|   |   |   +-- skeleton.tsx — 15 lines — Skeleton loader component
|   |   |   +-- switch.tsx — 28 lines — Switch toggle component
|   |   |   +-- table.tsx — 116 lines — Table component
|   |   |   +-- textarea.tsx — 22 lines — Textarea component
|   |   |   +-- tooltip.tsx — 30 lines — Tooltip component
|   +-- lib/
|   |   +-- supabase.ts — 7 lines — Supabase client configuration
|   |   +-- utils.ts — 5 lines — Utility functions
|   +-- middleware.ts — 19 lines — Next.js middleware for auth
|   +-- modules/
|   |   +-- auth/
|   |   |   +-- components/
|   |   |   |   +-- sign-in-form.tsx — 164 lines — Sign-in form component
|   |   |   +-- hooks/
|   |   |   |   +-- index.ts — 0 lines — Hooks exports
|   |   |   |   +-- use-auth.ts — 14 lines — Authentication hook
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 12 lines — Auth type definitions
|   |   |   +-- utils/
|   |   |   |   +-- auth-helpers.ts — 16 lines — Authentication helper functions
|   |   |   |   +-- index.ts — 0 lines — Utils exports
|   |   +-- case-processing/
|   |   |   +-- components/
|   |   |   |   +-- update-assistant/
|   |   |   |   |   +-- address-list.tsx — 94 lines — Address list component
|   |   |   |   |   +-- auto-post-countdown.tsx — 27 lines — Auto-post countdown timer
|   |   |   |   |   +-- draft-section.tsx — 179 lines — Draft section component
|   |   |   |   |   +-- index.tsx — 365 lines — Update assistant main component
|   |   |   |   |   +-- last-update.tsx — 101 lines — Last update display component
|   |   |   |   |   +-- update-alert.tsx — 51 lines — Update alert component
|   |   |   |   |   +-- use-template-loader.ts — 253 lines — Template loader hook
|   |   |   |   +-- validation/
|   |   |   |   |   +-- validation-keyword-analysis.tsx — 202 lines — Keyword analysis component
|   |   |   |   |   +-- validation-order-status.tsx — 76 lines — Order status validation
|   |   |   |   |   +-- validation-zipcode.tsx — 109 lines — Zipcode validation component
|   |   |   |   +-- validation-sections/
|   |   |   |   |   +-- agent-update-section.tsx — 80 lines — Agent update section
|   |   |   |   |   +-- auto-skip-countdown.tsx — 16 lines — Auto-skip countdown timer
|   |   |   |   |   +-- client-exclusion-section.tsx — 59 lines — Client exclusion section
|   |   |   |   |   +-- user-update-section.tsx — 85 lines — User update section
|   |   |   |   |   +-- validation-result-alert.tsx — 58 lines — Validation result alert
|   |   |   |   +-- workflow-steps/
|   |   |   |   |   +-- completion-step.tsx — 66 lines — Completion step component
|   |   |   |   |   +-- notification-step.tsx — 91 lines — Notification step component
|   |   |   |   |   +-- property-verification-step.tsx — 75 lines — Property verification step
|   |   |   |   |   +-- submission-step.tsx — 48 lines — Submission step component
|   |   |   |   |   +-- template-selection-step.tsx — 68 lines — Template selection step
|   |   |   |   |   +-- update-generation-step.tsx — 61 lines — Update generation step
|   |   |   |   |   +-- update-history-display.tsx — 163 lines — Update history display
|   |   |   |   |   +-- update-review-step.tsx — 99 lines — Update review step
|   |   |   |   |   +-- validation-step.tsx — 322 lines — Validation step component
|   |   |   |   +-- case-processing-layout.tsx — 333 lines — Case processing layout
|   |   |   |   +-- workflow-sidebar.tsx — 186 lines — Workflow sidebar component
|   |   |   +-- hooks/
|   |   |   |   +-- use-auto-skip.ts — 43 lines — Auto-skip functionality hook
|   |   |   |   +-- use-keyword-analysis.ts — 192 lines — Keyword analysis hook
|   |   |   |   +-- use-validation-logic.ts — 51 lines — Validation logic hook
|   |   |   +-- services/
|   |   |   |   +-- agent-update-validation.service.ts — 87 lines — Agent update validation
|   |   |   |   +-- case-validation.service.ts — 247 lines — Case validation service
|   |   |   |   +-- client-exclusion.service.ts — 97 lines — Client exclusion service
|   |   |   |   +-- keyword-check.service.ts — 148 lines — Keyword checking service
|   |   |   |   +-- openrouter.service.ts — 211 lines — OpenRouter API service
|   |   |   |   +-- post-update.service.ts — 49 lines — Post update service
|   |   |   |   +-- supabase-case.service.ts — 370 lines — Supabase case operations
|   |   |   |   +-- template.service.ts — 154 lines — Template management service
|   |   |   |   +-- update-history.service.ts — 52 lines — Update history service
|   |   |   |   +-- update-poster.service.ts — 386 lines — Update posting service
|   |   |   |   +-- validation-logic.service.ts — 96 lines — Validation logic service
|   |   |   +-- types/
|   |   |   |   +-- case.types.ts — 92 lines — Case type definitions
|   |   |   |   +-- index.ts — 46 lines — Type exports
|   |   +-- data-extraction/
|   |   |   +-- components/
|   |   |   |   +-- invoice-data-display.tsx — 122 lines — Invoice data display component
|   |   |   |   +-- invoice-page.tsx — 101 lines — Invoice page component
|   |   |   +-- services/
|   |   |   |   +-- database.ts — 145 lines — Database operations service
|   |   |   |   +-- index.ts — 3 lines — Service exports
|   |   |   |   +-- invoice-extractor.service.ts — 122 lines — Invoice extraction service
|   |   |   |   +-- invoice-processor.service.ts — 95 lines — Invoice processing service
|   |   |   |   +-- invoice-storage.service.ts — 103 lines — Invoice storage service
|   |   |   |   +-- supabase.ts — 17 lines — Supabase client service
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 76 lines — Data extraction type definitions
|   |   |   +-- utils/
|   |   |   |   +-- address-extractors.ts — 131 lines — Address extraction utilities
|   |   |   |   +-- extractors.ts — 280 lines — General extraction utilities
|   |   |   |   +-- status-normalizer.ts — 39 lines — Status normalization utility
|   |   |   |   +-- text-utils.ts — 4 lines — Text processing utilities
|   |   |   |   +-- update-extractors.ts — 168 lines — Update extraction utilities
|   |   |   |   +-- vin-details-extractor.ts — 240 lines — VIN details extraction
|   |   |   +-- extractCaseData.ts — 193 lines — Case data extraction main
|   |   |   +-- index.ts — 2 lines — Module exports
|   |   +-- module-1-rdn-portal/
|   |   |   +-- components/
|   |   |   |   +-- page-selection-dialog.tsx — 121 lines — Page selection dialog
|   |   |   |   +-- workflow-control.tsx — 280 lines — Workflow control component
|   |   |   |   +-- workflow-status.tsx — 90 lines — Workflow status display
|   |   |   +-- services/
|   |   |   |   +-- address-matcher.service.ts — 94 lines — Address matching and parsing
|   |   |   |   +-- auth-manager.service.ts — 124 lines — Authentication management
|   |   |   |   +-- browser-manager.service.ts — 168 lines — Browser automation service
|   |   |   |   +-- case-navigation.service.ts — 303 lines — Case navigation service
|   |   |   |   +-- case-processor.service.ts — 369 lines — Case processing service
|   |   |   |   +-- navigation-manager.service.ts — 499 lines — Navigation management
|   |   |   |   +-- portal-auth-workflow.service.ts — 53 lines — Portal auth workflow
|   |   |   |   +-- portal-navigation-workflow.service.ts — 138 lines — Portal navigation
|   |   |   |   +-- rdn-portal-service.ts — 234 lines — RDN portal main service
|   |   |   |   +-- update-poster.service.ts — 331 lines — Update posting service
|   |   |   |   +-- workflow-executor.service.ts — 208 lines — Workflow execution service
|   |   |   |   +-- workflow-state.service.ts — 78 lines — Workflow state management
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 64 lines — Module type definitions
|   |   |   +-- utils/
|   |   |   |   +-- iframe-helpers.ts — 88 lines — iFrame helper utilities
|   |   |   +-- navigate-to-case.ts — 29 lines — Case navigation utility
|   |   +-- module-4-agent-visibility/
|   |   |   +-- components/
|   |   |   |   +-- current-processing.tsx — 89 lines — Current processing display
|   |   |   |   +-- empty-state.tsx — 27 lines — Empty state component
|   |   |   |   +-- report-table.tsx — 113 lines — Report table component
|   |   |   |   +-- statistics-display.tsx — 66 lines — Statistics display component
|   |   |   |   +-- workflow-control.tsx — 118 lines — Workflow control component
|   |   |   +-- hooks/
|   |   |   |   +-- use-workflow.ts — 279 lines — Workflow management hook
|   |   |   +-- services/
|   |   |   |   +-- api-client.service.ts — 197 lines — API client service
|   |   |   |   +-- case-navigation.service.ts — 129 lines — Case navigation service
|   |   |   |   +-- protocol-buttons.service.ts — 119 lines — Protocol buttons service
|   |   |   |   +-- rdn-visibility.service.ts — 251 lines — RDN visibility service
|   |   |   |   +-- supabase-server.service.ts — 37 lines — Supabase server service
|   |   |   |   +-- update-discovery.service.ts — 160 lines — Update discovery service
|   |   |   |   +-- visibility-log.service.ts — 280 lines — Visibility log service
|   |   |   |   +-- visibility-toggle.service.ts — 291 lines — Visibility toggle service
|   |   |   |   +-- workflow-manager.service.ts — 332 lines — Workflow manager service
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 100 lines — Module type definitions
|   |   |   +-- utils/
|   |   |   |   +-- csv-export.utils.ts — 82 lines — CSV export utilities
|   |   |   |   +-- error-handler.ts — 37 lines — Error handling utilities
|   |   |   |   +-- pdf-export.utils.ts — 79 lines — PDF export utilities
|   |   +-- module-5-on-hold/
|   |   |   +-- components/
|   |   |   |   +-- case-display.tsx — 97 lines — Case display component
|   |   |   |   +-- on-hold-dashboard.tsx — 79 lines — On-hold dashboard component
|   |   |   |   +-- report-table.tsx — 132 lines — Report table component
|   |   |   |   +-- workflow-control.tsx — 89 lines — Workflow control component
|   |   |   +-- hooks/
|   |   |   |   +-- use-on-hold.ts — 197 lines — On-hold cases hook
|   |   |   |   +-- use-workflow-state.ts — 87 lines — Workflow state hook
|   |   |   +-- services/
|   |   |   |   +-- case-status.service.ts — 164 lines — Case status service
|   |   |   |   +-- navigation.service.ts — 134 lines — Navigation service
|   |   |   |   +-- on-hold-workflow.service.ts — 264 lines — On-hold workflow service
|   |   |   |   +-- supabase-log.service.ts — 106 lines — Supabase logging service
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 51 lines — Module type definitions
|   |   |   +-- utils/
|   |   |   |   +-- csv-export.ts — 48 lines — CSV export utilities
|   |   |   |   +-- error-handler.ts — 50 lines — Error handling utilities
|   |   +-- module-6-pending-close/
|   |   |   +-- components/
|   |   |   |   +-- case-display.tsx — 77 lines — Case display component
|   |   |   |   +-- pending-close-dashboard.tsx — 79 lines — Pending close dashboard
|   |   |   |   +-- report-table.tsx — 137 lines — Report table component
|   |   |   |   +-- workflow-control.tsx — 92 lines — Workflow control component
|   |   |   +-- hooks/
|   |   |   |   +-- use-pending-close.ts — 197 lines — Pending close cases hook
|   |   |   +-- services/
|   |   |   |   +-- case-status.service.ts — 210 lines — Case status service
|   |   |   |   +-- navigation.service.ts — 141 lines — Navigation service
|   |   |   |   +-- pending-close-workflow.service.ts — 274 lines — Pending close workflow
|   |   |   |   +-- supabase-log.service.ts — 125 lines — Supabase logging service
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 55 lines — Module type definitions
|   |   |   +-- utils/
|   |   |   |   +-- csv-export.ts — 54 lines — CSV export utilities
|   |   |   |   +-- error-handler.ts — 38 lines — Error handling utilities
|   |   +-- module-7-billing/
|   |   |   +-- components/
|   |   |   |   +-- billing-navigation.tsx — 69 lines — Billing navigation component
|   |   |   |   +-- case-update-fees.tsx — 79 lines — Case update fees component
|   |   |   |   +-- client-fee-rates.tsx — 68 lines — Client fee rates component
|   |   |   |   +-- fee-summary.tsx — 58 lines — Fee summary component
|   |   |   |   +-- workflow-status.tsx — 58 lines — Workflow status component
|   |   |   +-- hooks/
|   |   |   |   +-- use-billing-workflow.ts — 98 lines — Billing workflow hook
|   |   |   +-- services/
|   |   |   |   +-- billing-data.service.ts — 76 lines — Billing data service
|   |   |   |   +-- billing-workflow.service.ts — 96 lines — Billing workflow service
|   |   |   +-- types/
|   |   |   |   +-- index.ts — 42 lines — Module type definitions
|   |   |   +-- index.tsx — 98 lines — Module main component
|
+-- supabase/
|   +-- migrations/
|   |   +-- 20240101000000_create_case_tables.sql — 42 lines — Case tables migration
|   |   +-- 20240108_create_pending_close_log.sql — 41 lines — Pending close log migration
|
+-- CLAUDE.md — 74 lines — Claude AI project instructions
+-- README.md — 162 lines — Project documentation
+-- components.json — 16 lines — shadcn/ui component configuration
+-- eslint.config.mjs — 16 lines — ESLint configuration
+-- next-env.d.ts — 5 lines — Next.js TypeScript environment definitions
+-- next.config.ts — 11 lines — Next.js configuration
+-- package-lock.json — 🔥 8382 lines — NPM dependency lock file
+-- package.json — 54 lines — Project dependencies and scripts
+-- postcss.config.mjs — 8 lines — PostCSS configuration
+-- tailwind.config.ts — 94 lines — Tailwind CSS configuration
+-- tsconfig.json — 27 lines — TypeScript configuration