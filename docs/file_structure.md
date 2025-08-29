# Project File Structure

```
+-- CLAUDE.md — 74 lines — Project instructions and architecture guidelines
+-- README.md — 162 lines — Project documentation and setup instructions
|
+-- components.json — 16 lines — shadcn/ui components configuration
+-- dev.log — 61 lines — Development log and notes
+-- eslint.config.mjs — 16 lines — ESLint configuration for code linting
+-- next-env.d.ts — 5 lines — Next.js TypeScript environment declarations
+-- next.config.ts — 11 lines — Next.js configuration settings
+-- package-lock.json — Auto-generated — NPM dependency lock file
+-- package.json — 54 lines — NPM package configuration and dependencies
+-- postcss.config.mjs — 8 lines — PostCSS configuration for CSS processing
+-- tailwind.config.ts — 94 lines — Tailwind CSS configuration and theme setup
+-- tsconfig.json — 27 lines — TypeScript compiler configuration
+-- tsconfig.tsbuildinfo — Auto-generated — TypeScript build cache
|
+-- public/
|   +-- file.svg — SVG icon for file representation
|   +-- globe.svg — SVG icon for global/internet representation
|   +-- next.svg — Next.js framework logo
|   +-- vercel.svg — Vercel platform logo
|   +-- window.svg — SVG icon for window/browser representation
|
+-- src/
|   +-- app/
|   |   +-- agent-updates-visibility/
|   |   |   +-- page.tsx — 206 lines — Agent updates visibility page component
|   |   |
|   |   +-- api/
|   |   |   +-- billing-data/
|   |   |   |   +-- route.ts — 35 lines — API route for billing data retrieval
|   |   |   |
|   |   |   +-- billing-workflow/
|   |   |   |   +-- route.ts — 50 lines — API route for billing workflow operations
|   |   |   |
|   |   |   +-- case-processing/
|   |   |   |   +-- analyze-keywords/
|   |   |   |   |   +-- route.ts — 50 lines — API route for keyword analysis
|   |   |   |   |
|   |   |   |   +-- post-update/
|   |   |   |   |   +-- route.ts — 90 lines — API route for posting case updates
|   |   |   |   |
|   |   |   |   +-- process-agent-update/
|   |   |   |       +-- route.ts — 42 lines — API route for processing agent updates
|   |   |   |
|   |   |   +-- invoice-data/
|   |   |   |   +-- route.ts — 43 lines — API route for invoice data handling
|   |   |   |
|   |   |   +-- module-1/
|   |   |   |   +-- select-page/
|   |   |   |   |   +-- route.ts — 74 lines — API route for page selection in module 1
|   |   |   |   |
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 88 lines — API route for starting module 1 workflow
|   |   |   |   |
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 49 lines — API route for module 1 status
|   |   |   |   |
|   |   |   |   +-- stop-workflow/
|   |   |   |       +-- route.ts — 25 lines — API route for stopping module 1 workflow
|   |   |   |
|   |   |   +-- module-4/
|   |   |   |   +-- delete-log/
|   |   |   |   |   +-- route.ts — 31 lines — API route for deleting module 4 logs
|   |   |   |   |
|   |   |   |   +-- export-report/
|   |   |   |   |   +-- route.ts — 143 lines — API route for exporting module 4 reports
|   |   |   |   |
|   |   |   |   +-- health/
|   |   |   |   |   +-- route.ts — 50 lines — API route for module 4 health check
|   |   |   |   |
|   |   |   |   +-- process-case/
|   |   |   |   |   +-- route.ts — 55 lines — API route for processing cases in module 4
|   |   |   |   |
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 117 lines — API route for starting module 4 workflow
|   |   |   |   |
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 67 lines — API route for module 4 status
|   |   |   |   |
|   |   |   |   +-- stop-workflow/
|   |   |   |       +-- route.ts — 39 lines — API route for stopping module 4 workflow
|   |   |   |
|   |   |   +-- module-5/
|   |   |   |   +-- continue/
|   |   |   |   |   +-- route.ts — 30 lines — API route for continuing module 5 workflow
|   |   |   |   |
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 115 lines — API route for starting module 5 workflow
|   |   |   |   |
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 37 lines — API route for module 5 status
|   |   |   |   |
|   |   |   |   +-- stop/
|   |   |   |       +-- route.ts — 30 lines — API route for stopping module 5
|   |   |   |
|   |   |   +-- module-6/
|   |   |   |   +-- continue/
|   |   |   |   |   +-- route.ts — 30 lines — API route for continuing module 6 workflow
|   |   |   |   |
|   |   |   |   +-- start-workflow/
|   |   |   |   |   +-- route.ts — 115 lines — API route for starting module 6 workflow
|   |   |   |   |
|   |   |   |   +-- status/
|   |   |   |   |   +-- route.ts — 37 lines — API route for module 6 status
|   |   |   |   |
|   |   |   |   +-- stop/
|   |   |   |       +-- route.ts — 30 lines — API route for stopping module 6
|   |   |   |
|   |   |   +-- test-openrouter/
|   |   |       +-- route.ts — 136 lines — API route for testing OpenRouter integration
|   |   |
|   |   +-- billing-qc/
|   |   |   +-- layout.tsx — 17 lines — Layout component for billing QC pages
|   |   |   +-- page.tsx — 8 lines — Billing QC main page component
|   |   |
|   |   +-- billing-static/
|   |   |   +-- page.tsx — 341 lines — Static billing page component
|   |   |
|   |   +-- billing/
|   |   |   +-- page.tsx — 4 lines — Billing main page component
|   |   |
|   |   +-- case-processing/
|   |   |   +-- page.tsx — 9 lines — Case processing main page component
|   |   |
|   |   +-- dashboard/
|   |   |   +-- page.tsx — 293 lines — Main dashboard page component
|   |   |
|   |   +-- favicon.ico — Application favicon
|   |   +-- globals.css — 75 lines — Global CSS styles and Tailwind imports
|   |   +-- layout.tsx — 38 lines — Root layout component with providers
|   |   |
|   |   +-- on-hold/
|   |   |   +-- page.tsx — 4 lines — On-hold cases main page component
|   |   |
|   |   +-- page.module.css — 167 lines — CSS module for main page styles
|   |   +-- page.tsx — 5 lines — Application home page component
|   |   |
|   |   +-- pending-close/
|   |   |   +-- page.tsx — 4 lines — Pending close cases main page component
|   |   |
|   |   +-- sign-in/
|   |   |   +-- [[...sign-in]]/
|   |   |   |   +-- page.tsx — 21 lines — Dynamic sign-in page component
|   |   |   |
|   |   |   +-- page.tsx.bak — Backup sign-in page component
|   |   |
|   |   +-- sso-callback/
|   |       +-- page.tsx — 24 lines — SSO callback handler page
|   |
|   +-- components/
|   |   +-- app-layout/
|   |   |   +-- app-footer/
|   |   |   |   +-- index.tsx — 35 lines — Application footer component
|   |   |   |
|   |   |   +-- app-header/
|   |   |   |   +-- index.tsx — 25 lines — Main application header component
|   |   |   |   +-- logo-section.tsx — 6 lines — Header logo section component
|   |   |   |   +-- mobile-menu.tsx — 69 lines — Mobile navigation menu component
|   |   |   |   +-- navigation-section.tsx — 19 lines — Header navigation section component
|   |   |   |   +-- user-section.tsx — 56 lines — Header user section component
|   |   |   |
|   |   |   +-- app-sidebar/
|   |   |   |   +-- index.tsx — 37 lines — Main application sidebar component
|   |   |   |   +-- sidebar-item.tsx — 33 lines — Individual sidebar item component
|   |   |   |   +-- sidebar-section.tsx — 16 lines — Sidebar section grouping component
|   |   |   |
|   |   |   +-- content-container.tsx — 10 lines — Content container wrapper component
|   |   |   +-- index.tsx — 21 lines — Main app layout component
|   |   |
|   |   +-- ui/
|   |       +-- alert.tsx — 59 lines — Alert notification component
|   |       +-- badge.tsx — 36 lines — Badge/tag component
|   |       +-- button.tsx — 56 lines — Button component with variants
|   |       +-- card.tsx — 79 lines — Card container component
|   |       +-- checkbox.tsx — 30 lines — Checkbox input component
|   |       +-- input.tsx — 22 lines — Text input component
|   |       +-- label.tsx — 26 lines — Form label component
|   |       +-- progress.tsx — 28 lines — Progress bar component
|   |       +-- radio-group.tsx — 44 lines — Radio button group component
|   |       +-- select.tsx — 160 lines — Select dropdown component
|   |       +-- separator.tsx — 30 lines — Visual separator component
|   |       +-- sheet.tsx — 140 lines — Sheet/drawer component
|   |       +-- sidebar.tsx — 1 lines — Sidebar export component
|   |       |
|   |       +-- sidebar/
|   |       |   +-- index.tsx — 29 lines — Sidebar main component
|   |       |   +-- sidebar-components.tsx — 193 lines — Sidebar UI components
|   |       |   +-- sidebar-content.tsx — 163 lines — Sidebar content component
|   |       |   +-- sidebar-menu.tsx — 267 lines — Sidebar menu component
|   |       |   +-- sidebar-provider.tsx — 144 lines — Sidebar context provider
|   |       |
|   |       +-- skeleton.tsx — 15 lines — Loading skeleton component
|   |       +-- switch.tsx — 28 lines — Toggle switch component
|   |       +-- table.tsx — 116 lines — Table component with styling
|   |       +-- textarea.tsx — 22 lines — Textarea input component
|   |       +-- tooltip.tsx — 30 lines — Tooltip component
|   |
|   +-- hooks/
|   |
|   +-- lib/
|   |   +-- supabase.ts — 7 lines — Supabase client configuration
|   |   +-- utils.ts — 5 lines — Utility functions and class name helpers
|   |
|   +-- middleware.ts — 19 lines — Next.js middleware for authentication
|   |
|   +-- modules/
|       +-- auth/
|       |   +-- components/
|       |   |   +-- sign-in-form.tsx — 164 lines — Sign-in form component
|       |   |
|       |   +-- hooks/
|       |   |   +-- index.ts — Empty export file
|       |   |   +-- use-auth.ts — 14 lines — Authentication hook
|       |   |
|       |   +-- services/
|       |   |
|       |   +-- types/
|       |   |   +-- index.ts — 12 lines — Authentication type definitions
|       |   |
|       |   +-- utils/
|       |       +-- auth-helpers.ts — 16 lines — Authentication utility functions
|       |       +-- index.ts — Empty export file
|       |
|       +-- case-processing/
|       |   +-- actions/
|       |   |
|       |   +-- components/
|       |   |   +-- case-processing-layout.tsx — 342 lines — Main case processing layout
|       |   |   |
|       |   |   +-- update-assistant/
|       |   |   |   +-- address-list.tsx — 94 lines — Address list component for updates
|       |   |   |   +-- ai-generated-content.tsx — 69 lines — AI-generated content display
|       |   |   |   +-- auto-post-countdown.tsx — 27 lines — Auto-post countdown timer
|       |   |   |   +-- draft-section.tsx — 199 lines — Update draft section component
|       |   |   |   +-- index.tsx — 447 lines — Main update assistant component
|       |   |   |   +-- last-update.tsx — 101 lines — Last update display component
|       |   |   |   +-- update-alert.tsx — 51 lines — Update alert notification component
|       |   |   |   +-- use-template-loader.ts — 243 lines — Template loading hook
|       |   |   |
|       |   |   +-- validation-sections/
|       |   |   |   +-- agent-update-section.tsx — 80 lines — Agent update validation section
|       |   |   |   +-- auto-skip-countdown.tsx — 16 lines — Auto-skip countdown component
|       |   |   |   +-- client-exclusion-section.tsx — 59 lines — Client exclusion validation
|       |   |   |   +-- user-update-section.tsx — 85 lines — User update validation section
|       |   |   |   +-- validation-result-alert.tsx — 58 lines — Validation result alert
|       |   |   |
|       |   |   +-- validation/
|       |   |   |   +-- validation-keyword-analysis.tsx — 202 lines — Keyword analysis validation
|       |   |   |   +-- validation-order-status.tsx — 76 lines — Order status validation
|       |   |   |   +-- validation-zipcode.tsx — 109 lines — Zipcode validation component
|       |   |   |
|       |   |   +-- workflow-sidebar.tsx — 219 lines — Case processing workflow sidebar
|       |   |   |
|       |   |   +-- workflow-steps/
|       |   |       +-- completion-step.tsx — 66 lines — Workflow completion step
|       |   |       +-- notification-step.tsx — 91 lines — Notification step component
|       |   |       +-- property-verification-step.tsx — 75 lines — Property verification step
|       |   |       +-- submission-step.tsx — 48 lines — Update submission step
|       |   |       +-- template-selection-step.tsx — 68 lines — Template selection step
|       |   |       +-- update-generation-step.tsx — 61 lines — Update generation step
|       |   |       +-- update-history-display.tsx — 207 lines — Update history display
|       |   |       +-- update-review-step.tsx — 99 lines — Update review step
|       |   |       +-- validation-step.tsx — 328 lines — Validation workflow step
|       |   |
|       |   +-- hooks/
|       |   |   +-- use-auto-skip.ts — 43 lines — Auto-skip functionality hook
|       |   |   +-- use-keyword-analysis.ts — 192 lines — Keyword analysis hook
|       |   |   +-- use-validation-logic.ts — 51 lines — Validation logic hook
|       |   |
|       |   +-- services/
|       |   |   +-- agent-update-validation.service.ts — 87 lines — Agent update validation service
|       |   |   +-- case-validation.service.ts — 247 lines — Case validation service
|       |   |   +-- client-exclusion.service.ts — 97 lines — Client exclusion service
|       |   |   +-- keyword-check.service.ts — 148 lines — Keyword checking service
|       |   |   +-- openrouter.service.ts — 306 lines — OpenRouter AI service integration
|       |   |   +-- post-update.service.ts — 49 lines — Update posting service
|       |   |   +-- supabase-case.service.ts — 370 lines — Supabase case data service
|       |   |   +-- template.service.ts — 135 lines — Template management service
|       |   |   +-- update-history.service.ts — 52 lines — Update history service
|       |   |   +-- update-poster.service.ts — 495 lines — Update posting service
|       |   |   +-- validation-logic.service.ts — 96 lines — Validation logic service
|       |   |
|       |   +-- types/
|       |       +-- case.types.ts — 92 lines — Case-related type definitions
|       |       +-- index.ts — 46 lines — Module type exports
|       |
|       +-- data-extraction/
|       |   +-- components/
|       |   |   +-- invoice-data-display.tsx — 122 lines — Invoice data display component
|       |   |   +-- invoice-page.tsx — 101 lines — Invoice page component
|       |   |
|       |   +-- extractCaseData.ts — 206 lines — Main case data extraction logic
|       |   +-- index.ts — 2 lines — Module export file
|       |   |
|       |   +-- services/
|       |   |   +-- adjuster-payments-extractor.service.ts — 185 lines — Adjuster payments extractor
|       |   |   +-- adjuster-payments-storage.service.ts — 113 lines — Adjuster payments storage
|       |   |   +-- database.ts — 145 lines — Database service for data extraction
|       |   |   +-- index.ts — 3 lines — Services export file
|       |   |   +-- invoice-extractor.service.ts — 164 lines — Invoice extraction service
|       |   |   +-- invoice-processor.service.ts — 152 lines — Invoice processing service
|       |   |   +-- invoice-storage.service.ts — 139 lines — Invoice storage service
|       |   |   +-- supabase.ts — 17 lines — Supabase client for data extraction
|       |   |   +-- vehicle-photos-extractor.service.ts — 146 lines — Vehicle photos extractor
|       |   |   +-- vehicle-photos-storage.service.ts — 157 lines — Vehicle photos storage service
|       |   |
|       |   +-- types/
|       |   |   +-- index.ts — 76 lines — Data extraction type definitions
|       |   |
|       |   +-- utils/
|       |       +-- address-extractors.ts — 131 lines — Address extraction utilities
|       |       +-- extractors.ts — 280 lines — General data extraction utilities
|       |       +-- status-normalizer.ts — 39 lines — Status normalization utilities
|       |       +-- text-utils.ts — 4 lines — Text processing utilities
|       |       +-- update-extractors.ts — 168 lines — Update extraction utilities
|       |       +-- vin-details-extractor.ts — 240 lines — VIN details extraction utilities
|       |
|       +-- module-1-rdn-portal/
|       |   +-- components/
|       |   |   +-- page-selection-dialog.tsx — 121 lines — Page selection dialog component
|       |   |   +-- workflow-control.tsx — 280 lines — Workflow control component
|       |   |   +-- workflow-status.tsx — 90 lines — Workflow status display component
|       |   |
|       |   +-- navigate-to-case.ts — 29 lines — Case navigation utility
|       |   |
|       |   +-- services/
|       |   |   +-- address-matcher.service.ts — 94 lines — Address matching service
|       |   |   +-- auth-manager.service.ts — 124 lines — Authentication manager service
|       |   |   +-- browser-manager.service.ts — 197 lines — Browser automation manager
|       |   |   +-- case-navigation.service.ts — 341 lines — Case navigation service
|       |   |   +-- case-processor.service.ts — 369 lines — Case processing service
|       |   |   +-- authentication-handler.service.ts — 132 lines — Two-factor authentication handling service
|       |   |   +-- case-detail-navigation.service.ts — 188 lines — Individual case navigation service
|       |   |   +-- case-listing-navigation.service.ts — 129 lines — Case listing navigation service
|       |   |   +-- dashboard-navigation.service.ts — 24 lines — Dashboard navigation service
|       |   |   +-- navigation-manager.service.ts — 52 lines — Main navigation coordinator service
|       |   |   +-- navigation-utilities.service.ts — 71 lines — Navigation utilities and helpers
|       |   |   +-- pagination.service.ts — 246 lines — Pagination and page navigation service
|       |   |   +-- portal-auth-workflow.service.ts — 53 lines — Portal authentication workflow
|       |   |   +-- portal-navigation-workflow.service.ts — 138 lines — Portal navigation workflow
|       |   |   +-- rdn-portal-service.ts — 235 lines — RDN portal service
|       |   |   +-- update-poster.service.ts — 468 lines — Update posting service
|       |   |   +-- workflow-executor.service.ts — 279 lines — Workflow execution service
|       |   |   +-- workflow-state.service.ts — 78 lines — Workflow state management
|       |   |
|       |   +-- types/
|       |   |   +-- index.ts — 64 lines — Module type definitions
|       |   |
|       |   +-- utils/
|       |       +-- iframe-helpers.ts — 88 lines — iframe interaction utilities
|       |
|       +-- module-4-agent-visibility/
|       |   +-- components/
|       |   |   +-- current-processing.tsx — 89 lines — Current processing display component
|       |   |   +-- empty-state.tsx — 27 lines — Empty state component
|       |   |   +-- report-table.tsx — 113 lines — Report table component
|       |   |   +-- statistics-display.tsx — 66 lines — Statistics display component
|       |   |   +-- workflow-control.tsx — 118 lines — Workflow control component
|       |   |
|       |   +-- hooks/
|       |   |   +-- use-workflow.ts — 279 lines — Workflow management hook
|       |   |
|       |   +-- services/
|       |   |   +-- api-client.service.ts — 197 lines — API client service
|       |   |   +-- case-navigation.service.ts — 129 lines — Case navigation service
|       |   |   +-- protocol-buttons.service.ts — 119 lines — Protocol buttons service
|       |   |   +-- rdn-visibility.service.ts — 251 lines — RDN visibility service
|       |   |   +-- supabase-server.service.ts — 37 lines — Supabase server service
|       |   |   +-- update-discovery.service.ts — 160 lines — Update discovery service
|       |   |   +-- visibility-log.service.ts — 280 lines — Visibility logging service
|       |   |   +-- visibility-toggle.service.ts — 291 lines — Visibility toggle service
|       |   |   +-- workflow-manager.service.ts — 332 lines — Workflow manager service
|       |   |
|       |   +-- types/
|       |   |   +-- index.ts — 100 lines — Module type definitions
|       |   |
|       |   +-- utils/
|       |       +-- csv-export.utils.ts — 82 lines — CSV export utilities
|       |       +-- error-handler.ts — 37 lines — Error handling utilities
|       |       +-- pdf-export.utils.ts — 79 lines — PDF export utilities
|       |
|       +-- module-5-on-hold/
|       |   +-- components/
|       |   |   +-- case-display.tsx — 97 lines — Case display component
|       |   |   +-- on-hold-dashboard.tsx — 79 lines — On-hold dashboard component
|       |   |   +-- report-table.tsx — 132 lines — Report table component
|       |   |   +-- workflow-control.tsx — 89 lines — Workflow control component
|       |   |
|       |   +-- hooks/
|       |   |   +-- use-on-hold.ts — 197 lines — On-hold functionality hook
|       |   |   +-- use-workflow-state.ts — 87 lines — Workflow state management hook
|       |   |
|       |   +-- services/
|       |   |   +-- case-status.service.ts — 164 lines — Case status service
|       |   |   +-- navigation.service.ts — 134 lines — Navigation service
|       |   |   +-- on-hold-workflow.service.ts — 264 lines — On-hold workflow service
|       |   |   +-- supabase-log.service.ts — 106 lines — Supabase logging service
|       |   |
|       |   +-- types/
|       |   |   +-- index.ts — 51 lines — Module type definitions
|       |   |
|       |   +-- utils/
|       |       +-- csv-export.ts — 48 lines — CSV export utilities
|       |       +-- error-handler.ts — 50 lines — Error handling utilities
|       |
|       +-- module-6-pending-close/
|       |   +-- components/
|       |   |   +-- case-display.tsx — 77 lines — Case display component
|       |   |   +-- pending-close-dashboard.tsx — 79 lines — Pending close dashboard component
|       |   |   +-- report-table.tsx — 137 lines — Report table component
|       |   |   +-- workflow-control.tsx — 92 lines — Workflow control component
|       |   |
|       |   +-- hooks/
|       |   |   +-- use-pending-close.ts — 197 lines — Pending close functionality hook
|       |   |
|       |   +-- services/
|       |   |   +-- case-status.service.ts — 210 lines — Case status service
|       |   |   +-- navigation.service.ts — 141 lines — Navigation service
|       |   |   +-- pending-close-workflow.service.ts — 274 lines — Pending close workflow service
|       |   |   +-- supabase-log.service.ts — 125 lines — Supabase logging service
|       |   |
|       |   +-- types/
|       |   |   +-- index.ts — 55 lines — Module type definitions
|       |   |
|       |   +-- utils/
|       |       +-- csv-export.ts — 54 lines — CSV export utilities
|       |       +-- error-handler.ts — 38 lines — Error handling utilities
|       |
|       +-- module-7-billing-qc/
|       |   +-- components/
|       |   |   +-- case-updates-section.tsx — 210 lines — Case updates section component
|       |   |   +-- client-approved-fees-panel.tsx — 172 lines — Client approved fees panel
|       |   |   +-- empty-state.tsx — 60 lines — Empty state component
|       |   |   +-- fee-comparison.tsx — 167 lines — Fee comparison component
|       |   |   +-- header.tsx — 208 lines — Header component
|       |   |   +-- invoice-data-panel.tsx — 224 lines — Invoice data panel component
|       |   |   +-- loading-overlay.tsx — 22 lines — Loading overlay component
|       |   |   +-- qc-decision-summary.tsx — 225 lines — QC decision summary component
|       |   |
|       |   +-- hooks/
|       |   |   +-- use-ai-extraction.ts — 88 lines — AI extraction hook
|       |   |   +-- use-case-loader.ts — 61 lines — Case loader hook
|       |   |   +-- use-case-updates.ts — 163 lines — Case updates hook
|       |   |   +-- use-client-fees.ts — 74 lines — Client fees hook
|       |   |   +-- use-invoice-data.ts — 113 lines — Invoice data hook
|       |   |   +-- use-qc-analysis.ts — 125 lines — QC analysis hook
|       |   |
|       |   +-- index.tsx — 286 lines — Main module component
|       |   |
|       |   +-- services/
|       |   |   +-- billing-qc-service.ts — 371 lines — Billing QC service
|       |   |
|       |   +-- types/
|       |   |   +-- index.ts — 247 lines — Module type definitions
|       |   |
|       |   +-- utils/
|       |
|       +-- module-7-billing/
|           +-- components/
|           |   +-- billing-navigation.tsx — 69 lines — Billing navigation component
|           |   +-- case-update-fees.tsx — 79 lines — Case update fees component
|           |   +-- client-fee-rates.tsx — 68 lines — Client fee rates component
|           |   +-- fee-summary.tsx — 58 lines — Fee summary component
|           |   +-- workflow-status.tsx — 58 lines — Workflow status component
|           |
|           +-- hooks/
|           |   +-- use-billing-workflow.ts — 98 lines — Billing workflow hook
|           |
|           +-- index.tsx — 98 lines — Main module component
|           |
|           +-- services/
|           |   +-- billing-data.service.ts — 76 lines — Billing data service
|           |   +-- billing-workflow.service.ts — 96 lines — Billing workflow service
|           |
|           +-- types/
|               +-- index.ts — 42 lines — Module type definitions
|
+-- supabase/
    +-- migrations/
        +-- 20240101000000_create_case_tables.sql — 42 lines — Initial case tables creation
        +-- 20240108_create_pending_close_log.sql — 41 lines — Pending close log table creation
```