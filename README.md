# CareerSnap - Professional Job Portal Application

A modern, beautiful, and fully-featured job portal application built with Next.js 14, React 18, and TypeScript.

## Features

### Job Seekers
- Advanced job search with filters
- Browse job listings by category
- Save jobs for later
- Track job applications
- Complete professional profile
- Secure authentication
- Fully responsive design

### Employers
- Post job openings
- Manage applications
- Track job performance
- Beautiful job listings

### Design Features
- Professional, modern UI
- Accessible color scheme
- Smooth animations & transitions
- Mobile-first responsive design
- Dark-mode ready tokens

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules with Design Tokens
- **Components**: React 18
- **State**: React Hooks
- **Data**: Mock data layer with realistic content

## Project Structure

```
careersnap/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── page.tsx                 # Homepage
│   ├── jobs/
│   │   ├── page.tsx             # Job search page
│   │   └── [id]/page.tsx        # Job details page
│   ├── saved-jobs/              # Saved jobs page
│   ├── applications/            # Applications tracker
│   ├── profile/                 # User profile
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   ├── forgot-password/         # Password reset
│   ├── employers/               # Employer pages
│   └── not-found.tsx            # 404 page
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   └── select.tsx
│   └── layout/                  # Layout components
│       ├── header.tsx
│       └── footer.tsx
├── lib/
│   ├── design-tokens.ts         # Color, typography, spacing
│   ├── types.ts                 # TypeScript interfaces
│   ├── mock-data.ts             # Sample data
│   └── global-styles.ts         # Global CSS
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/careersnap.git
cd careersnap
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Key Pages

| Page | Path | Purpose |
|------|------|---------|
| Homepage | `/` | Hero section, featured jobs, categories |
| Job Search | `/jobs` | Advanced search with filters |
| Job Details | `/jobs/[id]` | Full job information |
| Saved Jobs | `/saved-jobs` | User's saved job listings |
| Applications | `/applications` | Application tracking dashboard |
| Profile | `/profile` | User profile & resume management |
| Login | `/login` | User authentication |
| Register | `/register` | Account creation |
| Employers | `/employers` | Employer solutions landing page |
| Post Job | `/employers/post-job` | Job posting form |

## Design System

### Colors
- **Primary**: Professional blue (#4a64e8) for trust and action
- **Neutral**: Professional grays for text and backgrounds
- **Semantic**: Success (green), warning (amber), danger (red)

### Typography
- **Font Family**: System fonts for optimal performance
- **Sizes**: 12px to 48px scale
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Spacing
- Consistent 8px-based scale
- CSS custom properties for easy theming

## Mock Data

The application includes comprehensive mock data:
- 10 realistic job listings
- 8 companies with details
- 10 job categories
- Sample user profile
- Mock applications

See `lib/mock-data.ts` for all sample data.

## Responsive Design

- **Mobile First**: Built with mobile-first approach
- **Breakpoints**:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

## Accessibility Features

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus indicators
- Color contrast compliance
- Skip to content links

## Performance

- Optimized images
- Code splitting with Next.js
- CSS Modules for scoped styling
- Minimal dependencies
- Static generation where possible

## Future Enhancements (Stage B & C)

### Backend Integration
- User authentication API
- Job posting management
- Application handling
- Payment processing

### Additional Features
- Advanced search filters
- Saved search alerts
- Job recommendations
- Company reviews
- Skills matching
- Video interviews

### Admin Dashboard
- Job analytics
- Application management
- User management
- Content moderation

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please file an issue on GitHub.

---

**Built by the CareerSnap Team**