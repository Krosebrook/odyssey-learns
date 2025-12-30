# Odyssey Learns

> **An interactive educational platform for children (K-12) with comprehensive parent oversight**

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0--beta-green.svg)](./CHANGELOG.md)
[![Documentation](https://img.shields.io/badge/docs-complete-brightgreen.svg)](./docs/DOCUMENTATION_INDEX.md)

---

## 🎯 What is Odyssey Learns?

Odyssey Learns is a modern, engaging educational platform that combines interactive lessons with gamification to create an effective learning experience for children. Parents have complete oversight and control while children enjoy a safe, motivating learning environment.

### ✨ Key Features

- 🎓 **Interactive Lessons** - Markdown-based lessons with embedded quizzes
- 🎮 **Gamification** - Points, badges, quests, and rewards
- 👥 **Parent-Child Model** - Secure oversight and monitoring
- 🎨 **Avatar Customization** - Personalized learning experience
- 📊 **Progress Tracking** - Comprehensive analytics
- 🤖 **AI-Powered** - Claude & Gemini AI integration
- 📱 **Responsive Design** - Works on all devices

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Krosebrook/odyssey-learns.git
cd odyssey-learns

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev

# Open http://localhost:5173
```

**Required**: Node.js 18+, npm 9+, Supabase account

---

## 📚 Complete Documentation

### 🌟 Start Here
- **[📖 Complete README](./docs/README_COMPLETE.md)** - Comprehensive guide
- **[📑 Documentation Index](./docs/DOCUMENTATION_INDEX.md)** - All docs organized
- **[📝 Changelog](./CHANGELOG.md)** - Version history

### 🏗️ Architecture & Design
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design
- **[Codebase Audit](./docs/CODEBASE_AUDIT.md)** - Code analysis
- **[Agents Documentation](./docs/agents.md)** - Modules & agents

### 🗺️ Roadmap & Planning
- **[MVP to V1.0 Roadmap](./docs/MVP_TO_V1_ROADMAP.md)** - Complete product roadmap
- **[Improvement Plan](./docs/IMPROVEMENT_PLAN.md)** - Quality improvements
- **[Refactor Plan](./docs/REFACTOR_PLAN.md)** - Code refactoring

### 🤖 AI Integration
- **[Claude AI Guide](./docs/claude.md)** - Claude integration
- **[Gemini AI Guide](./docs/gemini.md)** - Gemini integration

### 🔒 Security & Testing
- **[Security Testing Guide](./docs/security-testing-guide.md)** - Security procedures
- **[Debug Plan](./docs/DEBUG_PLAN.md)** - Debugging strategies

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **UI** | shadcn/ui, Radix UI, Tailwind CSS |
| **State** | React Query, React Context |
| **Forms** | React Hook Form, Zod |
| **Animation** | Framer Motion |
| **AI** | Claude (Anthropic), Gemini (Google) |

---

## 📁 Project Structure

```
odyssey-learns/
├── src/
│   ├── pages/           # 34 route components
│   ├── components/      # Organized by feature
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities & helpers
│   └── integrations/    # Supabase client
├── docs/                # Complete documentation
├── supabase/            # Database & functions
└── public/              # Static assets
```

---

## 💻 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npm run type-check
```

---

## 🤝 Contributing

We welcome contributions! Please see our [contribution guidelines](./docs/README_COMPLETE.md#contributing) in the complete README.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📊 Project Status

**Version**: 0.1.0 (MVP - Beta)  
**Status**: Feature-complete MVP in beta testing  
**Code Quality**: 7/10 (see [Codebase Audit](./docs/CODEBASE_AUDIT.md))  
**Test Coverage**: 0% (infrastructure planned)  
**Security**: Good (5 npm vulnerabilities to address)

---

## 🎯 Roadmap Highlights

### Current Focus (v0.5.0) - Next 3 Months
- ✅ Fix security vulnerabilities
- ✅ Add comprehensive testing
- ✅ Improve TypeScript type safety
- ✅ Performance optimization
- ✅ Mobile responsiveness

### Coming Soon (v0.8.0) - Months 4-6
- 🤖 AI-powered lesson generation
- 👥 Enhanced social features
- 📊 Advanced analytics
- 🎮 More gamification features

### Future (v1.0+)
- 📱 Native mobile apps
- 🌍 Multi-language support
- 🏫 School district partnerships
- 🎥 Video lessons

See [complete roadmap](./docs/MVP_TO_V1_ROADMAP.md) for details.

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 📞 Contact

- **Website**: https://odysseylearns.com
- **Email**: support@odysseylearns.com
- **GitHub**: https://github.com/Krosebrook/odyssey-learns
- **Issues**: https://github.com/Krosebrook/odyssey-learns/issues

---

## 🙏 Acknowledgments

Built with amazing open-source tools:
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

Originally bootstrapped with [Lovable](https://lovable.dev/)

---

**Made with ❤️ for learners everywhere**
