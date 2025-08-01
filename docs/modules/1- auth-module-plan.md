# Auth Module Plan

## Overview
**Module Name**: Auth  
**Path**: http://localhost:3000/  
**Description**: Login page with Microsoft OAuth and email/password authentication via Clerk.com

## Requirements
- Microsoft OAuth login (primary method)
- Email/password login (secondary method)
- No signup functionality
- Custom UI with Tailwind/Shadcn
- Redirect to dashboard after authentication

## Tech Stack
- Authentication: Clerk.com API
- UI: Shadcn UI two-column login block (login-02)

## Implementation Tasks

### 1. Layout & UI
- Implement two-column layout from Shadcn UI blocks
- Place Microsoft login button first, followed by divider and email/password form
- Use company branding/recruitment imagery in visual section
- Ensure responsive design (stack layout for mobile)

```
+-------------------------------------------+-------------------------------------------+
|           LOGIN FORM SECTION              |             VISUAL SECTION                |
|                                           |                                           |
|  +-----------------------------------+    |                                           |
|  |        COMPANY LOGO              |    |        BACKGROUND IMAGE OR GRADIENT       |
|  +-----------------------------------+    |                                           |
|                                           |        WITH COMPANY BRANDING              |
|  +-----------------------------------+    |                                           |
|  |  Sign in with Microsoft Button   |    |        OR RECRUITMENT IMAGERY             |
|  +-----------------------------------+    |                                           |
|                                           |                                           |
|  +-----------------------------------+    |                                           |
|  |           OR Divider             |    |                                           |
|  +-----------------------------------+    |                                           |
|                                           |                                           |
|  +-----------------------------------+    |                                           |
|  |  Email/Password Fields & Button  |    |                                           |
|  +-----------------------------------+    |                                           |
+-------------------------------------------+-------------------------------------------+
```

### 2. Authentication Integration
- Configure Clerk.com API keys and setup
- Implement Microsoft OAuth provider with priority placement
- Add email/password authentication as secondary option
- Set up authentication state management
- Add loading states and error handling

### 3. Routing & Redirection
- Implement route protection for authenticated routes
- Create redirect logic to dashboard after successful login

## Implementation Priority
1. Basic layout structure with Shadcn UI components
2. Microsoft OAuth integration
3. Email/password authentication
4. Form validation and error handling
5. Responsive design adjustments
6. Route protection and redirects

## Detailed Implementation Task List

### Phase 1: Setup & Foundation
- [ ] Install and configure Clerk.com SDK
- [ ] Configure environment variables for Clerk API keys
- [ ] Create layout structure using shadcn login-02 component
- [ ] Implement company branding assets (logo, colors, favicon)
- [ ] Add recruitment imagery for visual section

### Phase 2: Authentication Components
- [ ] Create Microsoft OAuth login button component
- [ ] Implement divider component with "OR" text
- [ ] Refactor existing login form for email/password
- [ ] Remove signup functionality from current implementation
- [ ] Implement loading states for authentication process
- [ ] Create error message component for auth failures

### Phase 3: Authentication Logic
- [ ] Implement Microsoft OAuth authentication flow
- [ ] Connect email/password form to Clerk.com backend
- [ ] Implement session management with Clerk.com
- [ ] Create auth context provider for global state
- [ ] Add form validation for email/password fields

### Phase 4: Routing & Security
- [ ] Implement middleware for route protection
- [ ] Create redirects for authenticated/unauthenticated users
- [ ] Set up dashboard redirect after successful login
- [ ] Add session persistence across browser refreshes
- [ ] Implement secure logout functionality

### Phase 5: Testing & Refinement
- [ ] Test authentication flows on multiple browsers
- [ ] Ensure responsive design works across devices
- [ ] Optimize loading performance
- [ ] Add accessibility improvements
- [ ] Implement comprehensive error handling