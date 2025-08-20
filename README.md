# Professional Towing RDN Portal Automation

A web application for automating case processing workflows in the Recovery Database Network (RDN) portal, streamlining update generation and management for Professional Towing and Recovery operations.

## Key Features

- **🤖 Automated RDN Portal Navigation**: Seamless login and navigation through RDN portal
- **📊 Intelligent Data Extraction**: Automated extraction and storage of case data
- **⚡ Automatic Processing Mode**: Toggle-enabled automatic case processing with smart skip logic for rejected cases
- **🎯 Manual Case Input**: Direct navigation to specific cases via case ID
- **🏢 Company Validation**: Process updates only from "Professional Towing and Recovery, LLC" with flexible pattern matching
- **👁️ Update Visibility Management**: Automated toggling of agent update visibility
- **📈 Real-time Progress Tracking**: Live status updates and workflow monitoring

## System Modules

### Module 1: RDN Portal Authentication & Navigation
- Automated login with stored credentials
- Smart navigation to case listings
- Direct case navigation for manual input
- Session management and reuse

### Module 2: Data Extraction
- Comprehensive case data extraction
- Multi-tab data collection (My Summary, Updates)
- Database storage in Supabase
- Update history tracking

### Module 3: Case Processing & Update Generation
- Case eligibility validation
- ZIP code coverage verification
- Keyword exclusion checking
- Template-based update generation
- Automatic mode with 2-second auto-skip for rejected cases

### Module 4: Agent Update Visibility Management
- Process updates from specific companies
- Toggle visibility status
- Comprehensive reporting with CSV export
- Manual and automatic processing modes

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- RDN Portal credentials

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your RDN Portal credentials to the `.env` file:
```
RDN_USERNAME=your_username
RDN_PASSWORD=your_password
RDN_SECURITY_CODE=your_security_code
```

3. Add Supabase configuration:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Usage

### Case Processing Workflow
1. Navigate to `/case-processing`
2. Click "Post Case Update" to start automated workflow
3. System will automatically:
   - Login to RDN portal
   - Extract case data
   - Validate eligibility
   - Generate updates

### Automatic Mode
- Toggle "Automatic Mode" in the sidebar
- Rejected cases auto-skip after 2 seconds
- Reduces manual intervention for invalid cases

### Manual Case Input
1. Enter specific case ID in the input field
2. Click "Load Case"
3. System navigates directly to the case in RDN portal
4. Continues with normal processing workflow

### Agent Update Visibility
1. Navigate to `/agent-updates-visibility`
2. Click "Start Processing"
3. Choose Manual or Automatic mode
4. System processes updates from "Professional Towing and Recovery, LLC"

## Tech Stack

- **Frontend**: Next.js 15, React 18
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Browser Automation**: Playwright
- **Language**: TypeScript

## Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── components/       # Shared UI components
├── modules/          # Feature modules
│   ├── auth/        # Authentication
│   ├── case-processing/  # Module 3
│   ├── data-extraction/  # Module 2
│   ├── module-1-rdn-portal/  # Module 1
│   └── module-4-agent-visibility/  # Module 4
└── lib/             # Utilities and configurations
```

## Development Guidelines

- **Module Independence**: Each module is self-contained with its own components, services, and types
- **File Size Limit**: Keep files under 500 lines following single responsibility principle
- **Component Library**: Use shadcn/ui components, avoid custom UI implementations
- **Styling**: Use Tailwind CSS classes, no custom CSS files

## Contributing

1. Follow the existing module structure
2. Maintain file size limits (< 500 lines)
3. Use TypeScript for type safety
4. Test thoroughly before committing

## License

Proprietary - Professional Towing and Recovery, LLC
