import { lazy } from 'react';
import { createLazyRoute } from './lazyRoutes';
import { ROUTE_PATHS } from '@/constants/routePaths';
import type { RouteConfig, RouteGroup, AppRoutes } from '@/types/routes';

// Eager-loaded pages (only critical landing and auth)
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

// Lazy-loaded static pages
const ResetPassword = createLazyRoute(() => import('@/pages/ResetPassword'));
const UpdatePassword = createLazyRoute(() => import('@/pages/UpdatePassword'));
const About = createLazyRoute(() => import('@/pages/About'));
const Features = createLazyRoute(() => import('@/pages/Features'));
const Pricing = createLazyRoute(() => import('@/pages/Pricing'));
const Contact = createLazyRoute(() => import('@/pages/Contact'));
const Support = createLazyRoute(() => import('@/pages/Support'));
const Terms = createLazyRoute(() => import('@/pages/Terms'));
const Privacy = createLazyRoute(() => import('@/pages/Privacy'));
const Discord = createLazyRoute(() => import('@/pages/Discord'));
const BetaProgram = createLazyRoute(() => import('@/pages/BetaProgram'));
const ChildSelector = createLazyRoute(() => import('@/pages/ChildSelector'));

// Lazy-loaded pages with preloading for critical routes
const ParentSetup = createLazyRoute(() => import('@/pages/ParentSetup'), { preload: true });
const ParentDashboard = createLazyRoute(() => import('@/pages/ParentDashboard'), { preload: true });
const ChildDashboard = createLazyRoute(() => import('@/pages/ChildDashboard'), { preload: true });
const LessonPlayer = createLazyRoute(() => import('@/pages/LessonPlayer'), { preload: true });
const AdminDashboard = createLazyRoute(() => import('@/pages/AdminDashboard'));
const CreatorDashboard = createLazyRoute(() => import('@/pages/CreatorDashboard'));
const CommunityLessons = createLazyRoute(() => import('@/pages/CommunityLessons'));

// Lazy-loaded secondary pages
const Lessons = createLazyRoute(() => import('@/pages/Lessons'), { preload: true });
const LessonDetail = createLazyRoute(() => import('@/pages/LessonDetail'));
const Badges = createLazyRoute(() => import('@/pages/Badges'));
const Social = createLazyRoute(() => import('@/pages/Social'));
const Settings = createLazyRoute(() => import('@/pages/Settings'));
const Rewards = createLazyRoute(() => import('@/pages/Rewards'));

// Admin pages
const BetaAnalytics = createLazyRoute(() => import('@/pages/BetaAnalytics'));
const BetaFeedbackAdmin = createLazyRoute(() => import('@/pages/BetaFeedbackAdmin'));
const AdminSetup = createLazyRoute(() => import('@/pages/AdminSetup'));
const LessonAnalytics = createLazyRoute(() => import('@/pages/LessonAnalytics'));
const Phase1LessonGeneration = createLazyRoute(() => import('@/pages/Phase1LessonGeneration'));
const SeedLessons = createLazyRoute(() => import('@/pages/SeedLessons'));
const LessonReview = createLazyRoute(() => import('@/pages/LessonReview'));
const LessonPerformanceAnalytics = createLazyRoute(() => import('@/pages/LessonPerformanceAnalytics'));
const StudentPerformanceReport = createLazyRoute(() => import('@/pages/StudentPerformanceReport'));
const SecurityMonitoring = createLazyRoute(() => import('@/pages/SecurityMonitoring'));
const SystemHealth = createLazyRoute(() => import('@/pages/SystemHealth'));

/**
 * Authentication routes configuration
 */
export const authRoutes: RouteConfig[] = [
  {
    path: ROUTE_PATHS.AUTH.LOGIN,
    component: Auth,
    requireAuth: false,
    meta: {
      title: 'Login - Inner Odyssey',
      description: 'Sign in to your Inner Odyssey account',
    },
  },
  {
    path: ROUTE_PATHS.AUTH.RESET_PASSWORD,
    component: ResetPassword,
    requireAuth: false,
    meta: {
      title: 'Reset Password - Inner Odyssey',
      description: 'Reset your password',
    },
  },
  {
    path: ROUTE_PATHS.AUTH.UPDATE_PASSWORD,
    component: UpdatePassword,
    requireAuth: false,
    meta: {
      title: 'Update Password - Inner Odyssey',
      description: 'Update your password',
    },
  },
];

/**
 * Public routes configuration
 */
export const publicRoutes: RouteConfig[] = [
  {
    path: ROUTE_PATHS.ROOT,
    component: Landing,
    requireAuth: false,
    preload: true,
    preloadPriority: 1,
    meta: {
      title: 'Inner Odyssey - Transform K-12 Education',
      description: 'Empower every child through emotional intelligence, academic excellence, and life skills',
    },
  },
  {
    path: ROUTE_PATHS.INDEX,
    component: ChildSelector,
    requireAuth: true,
  },
  {
    path: ROUTE_PATHS.PUBLIC.ABOUT,
    component: About,
    requireAuth: false,
    meta: {
      title: 'About Us - Inner Odyssey',
      description: 'Learn about our mission to transform K-12 education',
    },
  },
  {
    path: ROUTE_PATHS.PUBLIC.FEATURES,
    component: Features,
    requireAuth: false,
    meta: {
      title: 'Features - Inner Odyssey',
      description: 'Discover our comprehensive learning platform features',
    },
  },
  {
    path: ROUTE_PATHS.PUBLIC.PRICING,
    component: Pricing,
    requireAuth: false,
    meta: {
      title: 'Pricing - Inner Odyssey',
      description: 'Choose the perfect plan for your family',
    },
  },
  {
    path: ROUTE_PATHS.PUBLIC.CONTACT,
    component: Contact,
    requireAuth: false,
    meta: {
      title: 'Contact Us - Inner Odyssey',
      description: 'Get in touch with our team',
    },
  },
  {
    path: ROUTE_PATHS.PUBLIC.SUPPORT,
    component: Support,
    requireAuth: false,
    meta: {
      title: 'Support - Inner Odyssey',
      description: 'Get help and find answers to common questions',
    },
  },
  {
    path: ROUTE_PATHS.PUBLIC.TERMS,
    component: Terms,
    requireAuth: false,
    meta: {
      title: 'Terms of Service - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.PUBLIC.PRIVACY,
    component: Privacy,
    requireAuth: false,
    meta: {
      title: 'Privacy Policy - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.PUBLIC.DISCORD,
    component: Discord,
    requireAuth: false,
    meta: {
      title: 'Join Our Discord - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.PUBLIC.BETA_PROGRAM,
    component: BetaProgram,
    requireAuth: false,
    meta: {
      title: 'Beta Program - Inner Odyssey',
    },
  },
];

/**
 * Parent routes configuration
 */
export const parentRoutes: RouteConfig[] = [
  {
    path: ROUTE_PATHS.PARENT.DASHBOARD,
    component: ParentDashboard,
    requireAuth: true,
    roles: ['parent'],
    preload: true,
    preloadPriority: 1,
    meta: {
      title: 'Parent Dashboard - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.PARENT.SETUP,
    component: ParentSetup,
    requireAuth: true,
    roles: ['parent'],
    preload: true,
    preloadPriority: 1,
    meta: {
      title: 'Parent Setup - Inner Odyssey',
    },
  },
];

/**
 * Child routes configuration
 */
export const childRoutes: RouteConfig[] = [
  {
    path: ROUTE_PATHS.CHILD.DASHBOARD,
    component: ChildDashboard,
    requireAuth: true,
    roles: ['child'],
    preload: true,
    preloadPriority: 1,
    meta: {
      title: 'Dashboard - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.CHILD.LESSONS,
    component: Lessons,
    requireAuth: true,
    roles: ['child'],
    preload: true,
    preloadPriority: 1,
    meta: {
      title: 'Lessons - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.CHILD.LESSON_DETAIL,
    component: LessonDetail,
    requireAuth: true,
    roles: ['child'],
    preload: true,
    preloadPriority: 2,
    meta: {
      title: 'Lesson Details - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.CHILD.LESSON_PLAYER,
    component: LessonPlayer,
    requireAuth: true,
    roles: ['child'],
    preload: true,
    preloadPriority: 1,
    meta: {
      title: 'Lesson Player - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.CHILD.CREATOR_DASHBOARD,
    component: CreatorDashboard,
    requireAuth: true,
    roles: ['child'],
    meta: {
      title: 'Creator Dashboard - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.CHILD.COMMUNITY_LESSONS,
    component: CommunityLessons,
    requireAuth: true,
    roles: ['child'],
    meta: {
      title: 'Community Lessons - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.CHILD.BADGES,
    component: Badges,
    requireAuth: true,
    roles: ['child'],
    meta: {
      title: 'Badges - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.CHILD.SOCIAL,
    component: Social,
    requireAuth: true,
    roles: ['child'],
    meta: {
      title: 'Social - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.CHILD.SETTINGS,
    component: Settings,
    requireAuth: true,
    roles: ['child'],
    meta: {
      title: 'Settings - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.CHILD.REWARDS,
    component: Rewards,
    requireAuth: true,
    roles: ['child'],
    meta: {
      title: 'Rewards - Inner Odyssey',
    },
  },
];

/**
 * Admin routes configuration
 */
export const adminRoutes: RouteConfig[] = [
  {
    path: ROUTE_PATHS.ADMIN.DASHBOARD,
    component: AdminDashboard,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Admin Dashboard - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.SETUP,
    component: AdminSetup,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Admin Setup - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.ANALYTICS,
    component: BetaAnalytics,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Beta Analytics - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.FEEDBACK,
    component: BetaFeedbackAdmin,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Beta Feedback - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.LESSON_ANALYTICS,
    component: LessonAnalytics,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Lesson Analytics - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.LESSON_GENERATION,
    component: Phase1LessonGeneration,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Lesson Generation - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.SEED_LESSONS,
    component: SeedLessons,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Seed Lessons - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.LESSON_REVIEW,
    component: LessonReview,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Lesson Review - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.LESSON_PERFORMANCE,
    component: LessonPerformanceAnalytics,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Lesson Performance - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.STUDENT_PERFORMANCE,
    component: StudentPerformanceReport,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Student Performance - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.SECURITY_MONITORING,
    component: SecurityMonitoring,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'Security Monitoring - Inner Odyssey',
    },
  },
  {
    path: ROUTE_PATHS.ADMIN.SYSTEM_HEALTH,
    component: SystemHealth,
    requireAuth: true,
    roles: ['admin'],
    meta: {
      title: 'System Health - Inner Odyssey',
    },
  },
];

/**
 * Error routes configuration
 */
export const errorRoutes: RouteConfig[] = [
  {
    path: '*',
    component: NotFound,
    requireAuth: false,
    meta: {
      title: '404 - Page Not Found',
    },
  },
];

/**
 * Complete application routes organized by feature
 */
export const appRoutes: AppRoutes = {
  auth: {
    name: 'auth',
    basePath: '/auth',
    routes: authRoutes,
    requireAuth: false,
  },
  public: {
    name: 'public',
    basePath: '/',
    routes: publicRoutes,
    requireAuth: false,
  },
  parent: {
    name: 'parent',
    basePath: '/parent',
    routes: parentRoutes,
    requireAuth: true,
  },
  child: {
    name: 'child',
    basePath: '/child',
    routes: childRoutes,
    requireAuth: true,
  },
  admin: {
    name: 'admin',
    basePath: '/admin',
    routes: adminRoutes,
    requireAuth: true,
  },
};
