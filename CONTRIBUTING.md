# Contributing to Odyssey Learns

Thank you for your interest in contributing to Odyssey Learns! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We expect all participants to:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome people of all backgrounds and identities
- **Be Collaborative**: Work together to solve problems
- **Be Patient**: Help others learn and grow
- **Be Constructive**: Provide helpful feedback

### Unacceptable Behavior

- Harassment, discrimination, or intimidation
- Offensive comments or personal attacks
- Publishing private information without permission
- Trolling or sustained disruption
- Any conduct that could reasonably be considered inappropriate

### Enforcement

Violations can be reported to conduct@odysseylearns.com. All reports will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js v18.x or higher
- npm v9.x or higher
- Git
- A GitHub account
- A code editor (VS Code recommended)
- Basic knowledge of React, TypeScript, and Git

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:

```bash
git clone https://github.com/YOUR_USERNAME/odyssey-learns.git
cd odyssey-learns
```

3. **Add upstream remote**:

```bash
git remote add upstream https://github.com/Krosebrook/odyssey-learns.git
```

4. **Install dependencies**:

```bash
npm install
```

5. **Set up environment**:

Create a `.env` file (see `.env.example` if available):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

6. **Start development server**:

```bash
npm run dev
```

### Project Setup

To fully understand the project:

1. Read the [README.md](README.md) for project overview
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
3. Browse existing issues for tasks to work on
4. Join our [Discord](https://discord.gg/odyssey-learns) to ask questions

---

## Development Workflow

### Branch Strategy

We use a simplified Git Flow:

- **main**: Production-ready code
- **feature/**: New features (`feature/lesson-sharing`)
- **fix/**: Bug fixes (`fix/progress-calculation`)
- **docs/**: Documentation updates (`docs/api-reference`)
- **refactor/**: Code improvements (`refactor/lesson-service`)
- **test/**: Test additions (`test/lesson-player`)

### Creating a Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Development Cycle

1. **Make changes** in small, focused commits
2. **Test locally** to ensure nothing breaks
3. **Lint your code**: `npm run lint`
4. **Commit changes**: Follow commit guidelines below
5. **Push to your fork**: `git push origin feature/your-feature-name`
6. **Open a Pull Request** on GitHub

### Keeping Your Branch Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase on upstream main
git rebase upstream/main

# Push to your fork (force push after rebase)
git push origin feature/your-feature-name --force-with-lease
```

---

## Coding Standards

### TypeScript Guidelines

#### 1. Type Safety

**NEVER use `any` type**. Always define proper types:

```typescript
// ❌ Bad
const [child, setChild] = useState<any>(null);
const handleData = (data: any) => { };

// ✅ Good
interface Child {
  id: string;
  name: string;
  grade_level: number;
}

const [child, setChild] = useState<Child | null>(null);
const handleData = (data: Child) => { };
```

#### 2. Interface vs Type

Prefer `interface` for object shapes:

```typescript
// ✅ Preferred
interface Lesson {
  id: string;
  title: string;
  content: string;
}

// ⚠️ Use for unions, intersections, or aliases
type Status = 'pending' | 'approved' | 'denied';
type LessonWithProgress = Lesson & { progress: number };
```

#### 3. Type Exports

Export types from a central location:

```typescript
// src/types/lesson.ts
export interface Lesson {
  id: string;
  title: string;
  // ...
}

// Other files
import type { Lesson } from '@/types/lesson';
```

### React Guidelines

#### 1. Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Lesson } from '@/types/lesson';

// 2. Types/Interfaces
interface LessonCardProps {
  lesson: Lesson;
  onStart: (id: string) => void;
}

// 3. Component
export function LessonCard({ lesson, onStart }: LessonCardProps) {
  // 3a. Hooks
  const [isHovered, setIsHovered] = useState(false);
  
  // 3b. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 3c. Event handlers
  const handleClick = () => {
    onStart(lesson.id);
  };
  
  // 3d. Render
  return (
    <div onMouseEnter={() => setIsHovered(true)}>
      {/* JSX */}
    </div>
  );
}

// 4. Exports (if any sub-components)
```

#### 2. Hooks Rules

**Always include all dependencies**:

```typescript
// ❌ Bad - missing dependency
useEffect(() => {
  fetchData(userId);
}, []);

// ✅ Good - all dependencies included
useEffect(() => {
  fetchData(userId);
}, [userId, fetchData]);

// ✅ Good - stable function with useCallback
const fetchData = useCallback(async (id: string) => {
  const data = await getData(id);
  setData(data);
}, []);

useEffect(() => {
  fetchData(userId);
}, [userId, fetchData]);
```

#### 3. Custom Hooks

Extract reusable logic:

```typescript
// hooks/useLessons.ts
export function useLessons(gradeLevel: number) {
  return useQuery({
    queryKey: ['lessons', gradeLevel],
    queryFn: () => fetchLessons(gradeLevel),
    staleTime: 5 * 60 * 1000,
  });
}

// Usage
const { data: lessons, isLoading, error } = useLessons(5);
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `LessonPlayer`, `BadgeCard` |
| Files (Components) | PascalCase | `LessonPlayer.tsx` |
| Files (Utils) | camelCase | `inputSanitization.ts` |
| Variables | camelCase | `currentUser`, `lessonId` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |
| Interfaces | PascalCase | `User`, `LessonData` |
| Types | PascalCase | `Status`, `ThemeMode` |
| Functions | camelCase | `getUserData`, `calculateScore` |
| React Props | PascalCase + Props | `LessonCardProps` |

### File Organization

```typescript
// ✅ Good - absolute imports
import { Button } from '@/components/ui/button';
import { useLessons } from '@/hooks/useLessons';
import { sanitizeText } from '@/lib/inputSanitization';

// ❌ Bad - relative imports for shared code
import { Button } from '../../components/ui/button';
```

### Styling Guidelines

#### 1. Tailwind CSS

Use utility classes, keep them organized:

```typescript
// ✅ Good - organized classes
<div className="
  flex items-center justify-between
  p-4 rounded-lg
  bg-white dark:bg-gray-800
  border border-gray-200
  hover:shadow-md transition-shadow
">

// ❌ Bad - unorganized
<div className="p-4 hover:shadow-md flex bg-white items-center rounded-lg border-gray-200 border justify-between transition-shadow dark:bg-gray-800">
```

#### 2. Conditional Classes

Use `cn()` utility:

```typescript
import { cn } from '@/lib/utils';

<Button
  className={cn(
    'base-classes',
    isActive && 'active-classes',
    isDisabled && 'disabled-classes',
    customClassName
  )}
>
```

### Security Guidelines

#### 1. Input Sanitization

**ALWAYS sanitize user inputs**:

```typescript
import { sanitizeText } from '@/lib/inputSanitization';

// Before saving
const sanitizedTitle = sanitizeText(formData.title);
await saveLesson({ ...formData, title: sanitizedTitle });
```

#### 2. Rendering User Content

Use DOMPurify for HTML content:

```typescript
import DOMPurify from 'dompurify';

<div 
  dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(userContent) 
  }} 
/>
```

#### 3. Environment Variables

Never commit secrets:

```typescript
// ✅ Good
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ Bad
const apiKey = 'hardcoded-secret-key';
```

### Error Handling

#### 1. User-Facing Errors

Use toast notifications:

```typescript
import { toast } from 'sonner';

try {
  await saveLesson(data);
  toast.success('Lesson saved successfully!');
} catch (error) {
  console.error('Error saving lesson:', error);
  toast.error('Failed to save lesson. Please try again.');
}
```

#### 2. Async Operations

Always handle errors:

```typescript
// ✅ Good
async function fetchData() {
  try {
    const data = await api.getData();
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error; // Re-throw if needed
  }
}

// ❌ Bad - no error handling
async function fetchData() {
  const data = await api.getData();
  return data;
}
```

### Performance Guidelines

#### 1. React.memo

Use sparingly, only when profiling shows benefit:

```typescript
// ✅ Good use case - expensive render
export const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  // Heavy computation
  const processed = heavyCalculation(data);
  
  return <div>{processed}</div>;
});

// ❌ Bad - premature optimization
export const SimpleComponent = React.memo(function SimpleComponent({ text }) {
  return <div>{text}</div>;
});
```

#### 2. useCallback and useMemo

Use appropriately:

```typescript
// ✅ Good - stable function reference
const handleClick = useCallback(() => {
  processData(data);
}, [data]);

// ✅ Good - expensive calculation
const sortedItems = useMemo(() => {
  return items.sort(complexComparison);
}, [items]);

// ❌ Bad - unnecessary
const sum = useMemo(() => a + b, [a, b]);
```

### Accessibility

Ensure accessibility in all components:

```typescript
// ✅ Good
<button
  aria-label="Close dialog"
  onClick={handleClose}
  className="p-2"
>
  <X className="w-4 h-4" />
</button>

<img 
  src={avatar} 
  alt={`${userName}'s avatar`}
/>

// ❌ Bad - no labels
<button onClick={handleClose}>
  <X />
</button>

<img src={avatar} />
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style (formatting, no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(lessons): add lesson sharing functionality"

# Bug fix
git commit -m "fix(progress): correct calculation of completion percentage"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api): change lesson API endpoint

BREAKING CHANGE: Lesson endpoint moved from /api/lessons to /api/v2/lessons"
```

### Commit Best Practices

1. **Write clear, concise messages**
2. **Use imperative mood** ("add" not "added")
3. **Keep subject under 72 characters**
4. **Explain what and why, not how**
5. **Reference issues**: `fix(auth): resolve login timeout (#123)`

---

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest main
2. **Run linter**: `npm run lint`
3. **Test locally**: Ensure everything works
4. **Review your changes**: Read through the diff
5. **Write tests**: Add tests for new features
6. **Update documentation**: If needed

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2

## Testing
How was this tested?

## Screenshots
If UI changes, add screenshots

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests pass
```

### Review Process

1. **Automated checks** must pass (linting, etc.)
2. **At least one approval** required
3. **Address feedback** promptly
4. **Keep PR focused** - one feature/fix per PR
5. **Squash commits** if requested

### After Merge

1. **Delete your branch**:
```bash
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

2. **Update your fork**:
```bash
git checkout main
git pull upstream main
git push origin main
```

---

## Testing Guidelines

### Test Structure

```typescript
import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { LessonCard } from './LessonCard';

describe('LessonCard', () => {
  test('renders lesson title', () => {
    const lesson = {
      id: '1',
      title: 'Test Lesson',
      subject: 'math',
    };
    
    render(<LessonCard lesson={lesson} />);
    
    expect(screen.getByText('Test Lesson')).toBeInTheDocument();
  });
  
  test('calls onStart when clicked', () => {
    const handleStart = vi.fn();
    const lesson = { id: '1', title: 'Test' };
    
    render(<LessonCard lesson={lesson} onStart={handleStart} />);
    
    fireEvent.click(screen.getByText('Start'));
    
    expect(handleStart).toHaveBeenCalledWith('1');
  });
});
```

### Testing Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Arrange, Act, Assert pattern**
4. **Mock external dependencies**
5. **Test edge cases and error states**

---

## Documentation

### Code Comments

Add comments for complex logic:

```typescript
// ✅ Good - explains why
// We use exponential backoff to handle rate limits gracefully
// and avoid overwhelming the API during high traffic
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

// ❌ Bad - obvious
// Add 1 to counter
counter = counter + 1;
```

### JSDoc Comments

Document public APIs:

```typescript
/**
 * Calculates the total points earned by a child
 * @param childId - The unique identifier of the child
 * @param startDate - Optional start date for calculation
 * @returns Promise resolving to total points
 * @throws {Error} If child not found
 */
export async function calculateTotalPoints(
  childId: string,
  startDate?: Date
): Promise<number> {
  // Implementation
}
```

### README Updates

Update relevant documentation when:
- Adding new features
- Changing setup process
- Modifying dependencies
- Updating deployment process

---

## Issue Reporting

### Bug Reports

Include:

1. **Clear title**: Describe the issue concisely
2. **Steps to reproduce**: Detailed steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**: OS, browser, versions
6. **Screenshots**: If applicable
7. **Error messages**: Full error logs

### Feature Requests

Include:

1. **Clear description**: What feature you want
2. **Use case**: Why you need it
3. **Proposed solution**: How it might work
4. **Alternatives**: Other approaches considered
5. **Mockups**: Visual examples if applicable

### Questions

Before asking:

1. **Search existing issues** and documentation
2. **Check Discord** for quick answers
3. **Read relevant docs**: README, ARCHITECTURE
4. **Provide context**: What you're trying to achieve

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat and help
- **Email**: security@odysseylearns.com (security issues only)

### Getting Help

- Read the documentation first
- Search existing issues
- Ask in Discord for quick questions
- Open an issue for bugs or features
- Be patient and respectful

### Staying Updated

- Watch the repository for notifications
- Follow releases and changelogs
- Join Discord for announcements
- Read weekly update threads

---

## Recognition

Contributors are recognized in:

- GitHub contributors page
- CHANGELOG.md for significant contributions
- Special mentions in release notes
- Annual contributor shoutouts

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to Odyssey Learns!** 🎓

Every contribution, no matter how small, helps make learning better for children everywhere.
