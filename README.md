# 🎓 Odyssey Learns

> An interactive educational platform for children (K-12) with comprehensive parent oversight and gamification.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.75.0-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## 🎯 Overview

Odyssey Learns is a modern educational platform designed to make learning engaging and fun for children from Kindergarten through 12th grade. The platform combines interactive lessons, gamification elements, and comprehensive parental controls to create a safe and motivating learning environment.

### Key Highlights

- 🎮 **Gamification System**: Points, badges, daily quests, and rewards to motivate learning
- 👨‍👩‍👧‍👦 **Parent Dashboard**: Complete oversight with progress tracking and reward management
- 🎨 **Avatar Customization**: Personalized avatars that children can customize with earned rewards
- 📚 **Multi-Subject Lessons**: Reading, Math, Science, Social Studies, and Life Skills
- 🤝 **Social Learning**: Collaborative activities and community lesson sharing
- 📊 **Progress Tracking**: Detailed analytics for parents and visual progress for children
- 🔒 **Security First**: Row-level security, input sanitization, and COPPA-compliant design

## ✨ Features

### For Children

- **Interactive Lessons**: Markdown-based lessons with embedded quizzes and activities
- **Avatar System**: Customizable avatars with unlockable items earned through learning
- **Gamification**: 
  - Earn points for completing lessons
  - Unlock badges for achievements
  - Complete daily quests for bonus rewards
- **Emotion Check-ins**: Track mood and energy levels before learning sessions
- **Visual Progress**: See completed lessons and earned rewards
- **Social Learning**: Collaborate with friends on shared activities

### For Parents

- **Comprehensive Dashboard**: Overview of all children's progress and activities
- **Lesson Management**: Browse and assign lessons appropriate for each child's grade level
- **Reward System**: Create custom rewards (e.g., "30 min extra screen time", "Pizza night")
- **Screen Time Monitoring**: Track usage and set healthy limits
- **Progress Reports**: Detailed statistics on lesson completion, scores, and time spent
- **Approval Workflows**: Review and approve reward redemption requests
- **Safety Controls**: Monitor activity and ensure age-appropriate content

### Platform Features

- **Grade-Based Content**: Lessons tailored for each grade level (K-12)
- **Multiple Subjects**: Reading, Math, Science, Social Studies, Life Skills
- **Community Lessons**: Share and discover lessons created by other educators
- **Beta Program**: Early access to new features with feedback integration
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility**: Built with accessibility standards in mind

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18.3.1 with TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19 (fast development and optimized builds)
- **Routing**: React Router v6.30.1
- **State Management**: 
  - React Query (@tanstack/react-query) for server state
  - React Context for auth and global state
- **UI Components**: 
  - shadcn/ui (40+ Radix UI primitives)
  - Tailwind CSS 3.4.17 for styling
  - Lucide React for icons
- **Forms**: React Hook Form 7.61.1 with Zod 3.25.76 validation
- **Animations**: Framer Motion 12.23.24
- **Markdown**: React Markdown 9.1.0 with syntax highlighting

### Backend

- **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS)
- **Authentication**: Supabase Auth with email/password and social providers
- **Storage**: Supabase Storage for avatars and lesson thumbnails
- **Real-time**: Supabase Realtime for live notifications
- **Edge Functions**: Supabase Edge Functions (Deno) for server-side logic

### Security

- **Input Sanitization**: DOMPurify for XSS prevention
- **Rate Limiting**: Client-side rate limiting for sensitive operations
- **Password Strength**: zxcvbn for password validation
- **HTTPS**: Enforced for all connections
- **RLS Policies**: Database-level security for data isolation

### Development Tools

- **Linting**: ESLint 9.32.0 with TypeScript support
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm (lockfile included)
- **Version Control**: Git with GitHub

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or higher ([install with nvm](https://github.com/nvm-sh/nvm))
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: Latest version
- **Supabase Account**: Free tier available at [supabase.com](https://supabase.com)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Krosebrook/odyssey-learns.git
cd odyssey-learns
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get your Supabase credentials from your project settings at [app.supabase.com](https://app.supabase.com)

4. **Set up the database**

Run the Supabase migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

5. **Start the development server**

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### First Time Setup

1. **Create a parent account**: Navigate to `/login` and sign up with your email
2. **Set up your profile**: Complete the parent setup wizard
3. **Add a child**: Create a child profile with name, grade level, and PIN
4. **Explore lessons**: Browse lessons by grade level and subject
5. **Set up rewards**: Define custom rewards for your children to work towards

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────┐
│   React App     │
│  (Vite + TS)    │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
    ┌────▼─────┐    ┌─────▼──────┐
    │ Supabase │    │  External  │
    │   API    │    │  Services  │
    └────┬─────┘    └────────────┘
         │
    ┌────▼──────────────┐
    │   PostgreSQL DB   │
    │   + RLS Policies  │
    └───────────────────┘
```

### Frontend Architecture

The application follows a feature-based component organization:

```
src/
├── pages/              # Route components (30+ pages)
├── components/         # Feature-organized components
│   ├── admin/          # Admin features
│   ├── auth/           # Authentication UI
│   ├── avatar/         # Avatar customization
│   ├── badges/         # Badge display
│   ├── gamification/   # Points, tokens, rewards
│   ├── learning/       # Lesson components
│   ├── parent/         # Parent dashboard
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and helpers
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
└── main.tsx            # Application entry point
```

### Database Schema

Key tables and their relationships:

- **profiles**: User accounts (parent/child roles)
- **children**: Child profiles linked to parent accounts
- **lessons**: Educational content with markdown and quizzes
- **user_progress**: Tracks lesson completion and scores
- **rewards**: Parent-defined rewards
- **reward_redemptions**: Reward request workflow
- **achievement_badges**: Badge definitions
- **user_badges**: Earned badges
- **daily_quests**: Daily learning goals
- **screen_time_sessions**: Usage tracking
- **notifications**: In-app notification system

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## 📁 Project Structure

```
odyssey-learns/
├── src/
│   ├── components/        # React components
│   │   ├── admin/         # Admin dashboard components
│   │   ├── auth/          # Authentication flows
│   │   ├── avatar/        # Avatar customization
│   │   ├── badges/        # Badge system
│   │   ├── gamification/  # Points, rewards, quests
│   │   ├── learning/      # Lesson player, quiz
│   │   ├── parent/        # Parent dashboard
│   │   └── ui/            # Reusable UI (shadcn/ui)
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.tsx    # Authentication hook
│   │   ├── use-toast.ts   # Toast notifications
│   │   └── ...
│   ├── lib/               # Utilities
│   │   ├── inputSanitization.ts
│   │   ├── rateLimiter.ts
│   │   ├── badgeChecker.ts
│   │   └── utils.ts
│   ├── pages/             # Route pages
│   ├── integrations/      # Supabase integration
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── supabase/
│   ├── migrations/        # Database migrations
│   └── config.toml        # Supabase configuration
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   ├── ROADMAP.md
│   └── modules/           # Module-specific docs
├── public/                # Static assets
├── .github/               # GitHub workflows and templates
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Preview production build
npm run preview

# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Development Workflow

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

Follow the coding standards in [CONTRIBUTING.md](docs/CONTRIBUTING.md)

3. **Test your changes**

```bash
npm run dev
# Test in browser
```

4. **Lint your code**

```bash
npm run lint
```

5. **Commit and push**

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
```

6. **Create a pull request**

Use the pull request template and request review

### Coding Standards

- **TypeScript**: Always use proper types, avoid `any`
- **Components**: Functional components with hooks
- **Naming**: 
  - Components: PascalCase
  - Files: PascalCase for components, camelCase for utilities
  - Variables: camelCase
  - Constants: UPPER_SNAKE_CASE
- **Imports**: Absolute imports with `@/` alias
- **Styling**: Tailwind CSS utility classes
- **State**: React Query for server state, Context for global state

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for complete guidelines.

## 🧪 Testing

### Testing Strategy

Currently, the project is in the process of implementing comprehensive testing:

- **Unit Tests**: Testing utility functions and hooks
- **Component Tests**: Testing UI components in isolation
- **Integration Tests**: Testing feature workflows
- **E2E Tests**: Testing critical user journeys

### Running Tests (Coming Soon)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage Goals

- Utilities: 90%+ coverage
- Hooks: 80%+ coverage
- Components: 70%+ coverage
- Pages: 60%+ coverage

## 🚢 Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# The build output will be in the dist/ directory
```

### Deployment Options

#### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy automatically on push

#### Option 2: Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Set environment variables in Netlify dashboard

#### Option 3: Self-Hosted

1. Build the project: `npm run build`
2. Serve the `dist` folder with any static file server
3. Ensure proper HTTPS configuration

### Environment Variables

Required environment variables for production:

```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Coding standards
- Pull request process
- Issue reporting

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 🔒 Security

### Security Features

- **Input Sanitization**: All user inputs are sanitized
- **XSS Protection**: DOMPurify sanitizes rendered content
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **Row-Level Security**: Database-level access control
- **Rate Limiting**: Client-side rate limiting for sensitive operations
- **Password Security**: Strong password requirements with zxcvbn
- **HTTPS**: Enforced for all connections

### Reporting Security Issues

If you discover a security vulnerability, please email security@odysseylearns.com instead of using the issue tracker.

### Security Best Practices

- Never commit `.env` files or secrets
- Always sanitize user inputs
- Use proper authentication checks
- Follow OWASP guidelines
- Keep dependencies updated

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Supabase](https://supabase.com/) - Backend platform
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Krosebrook/odyssey-learns/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Krosebrook/odyssey-learns/discussions)
- **Discord**: [Join our community](https://discord.gg/odyssey-learns)

## 🗺️ Roadmap

See [ROADMAP.md](docs/ROADMAP.md) for the complete project roadmap including:

- Current sprint goals
- Upcoming features
- Long-term vision
- Community requests

---

**Made with ❤️ for curious young minds**
