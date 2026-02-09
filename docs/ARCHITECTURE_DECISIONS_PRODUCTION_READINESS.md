# Architecture Decisions - Production Readiness Initiative

## ADR-001: Capacitor for Mobile Platform Support

**Status**: Accepted  
**Date**: 2026-02-09  
**Context**: Need to support Android platform while maintaining web as primary runtime

### Decision
Use Capacitor as a thin wrapper around the web application rather than building a native Android app.

### Rationale
1. **Single Codebase**: Maintain one codebase for web and mobile
2. **Faster Development**: No need to learn/maintain native Android code
3. **Lower Risk**: Web app already works, just needs native shell
4. **Progressive Enhancement**: Can add native features later if needed
5. **Cost Effective**: No separate mobile development team required

### Consequences
**Positive**:
- Zero code changes required for mobile support
- Build process is straightforward (web build + sync)
- Updates deploy simultaneously to web and mobile
- Team can focus on feature development, not platform differences

**Negative**:
- Limited access to native APIs (acceptable for MVP)
- Performance not as optimal as pure native (acceptable trade-off)
- Requires Android Studio for builds (standard for Android development)

**Mitigation**:
- Document build process thoroughly (docs/CAPACITOR_SETUP.md)
- Use responsive design to ensure mobile UX is good
- Monitor performance metrics post-launch

---

## ADR-002: Unit Tests Over Integration Tests

**Status**: Accepted  
**Date**: 2026-02-09  
**Context**: Need to reach 30% test coverage with limited time

### Decision
Focus on unit tests for business logic and utilities rather than integration tests.

### Rationale
1. **Speed**: Unit tests run in <10 seconds vs minutes for integration
2. **Maintainability**: Unit tests are easier to understand and maintain
3. **Coverage**: Unit tests provide more granular coverage of edge cases
4. **Cost**: No need for database setup, mocking is simpler
5. **Existing Tests**: Integration tests already exist (e2e suite)

### Consequences
**Positive**:
- 110 new tests added quickly
- Tests are fast and reliable
- Good coverage of business logic (input validation, calculations, etc.)
- CI runs complete in seconds

**Negative**:
- Less confidence in full-stack integration
- Database interactions not fully tested
- Some edge cases in data flow might be missed

**Mitigation**:
- Existing e2e tests cover full-stack flows
- Manual testing for critical user journeys
- Plan integration tests for future sprints

---

## ADR-003: Database-Level Security with RLS

**Status**: Accepted  
**Date**: 2026-02-09  
**Context**: Need to prevent cross-user data access and ensure compliance

### Decision
Enforce security at the database level using Postgres Row Level Security (RLS) rather than relying solely on application-level checks.

### Rationale
1. **Defense in Depth**: Security at multiple layers (app + database)
2. **Compliance**: COPPA/FERPA require strict data isolation
3. **Audit Trail**: RLS policies are explicit and auditable
4. **Fail-Safe**: Even if app code has bugs, database enforces security
5. **Performance**: RLS uses indexes, queries remain fast

### Consequences
**Positive**:
- Cannot accidentally leak data across users
- Compliance requirements automatically enforced
- Admin access properly restricted
- Security audits are easier (policies are in SQL)

**Negative**:
- More complex database migrations
- RLS policies can be tricky to debug
- Some queries are slightly slower (negligible impact)
- Developers need to understand RLS

**Mitigation**:
- Comprehensive documentation (docs/RLS_DOCUMENTATION.md)
- Test cases for common access patterns
- Developer training on RLS concepts
- Monitoring for slow queries

---

## ADR-004: Route-Based Code Splitting

**Status**: Accepted  
**Date**: 2026-02-09  
**Context**: Need to reduce initial bundle size for faster page loads

### Decision
Split code by route (page-level) rather than by component or feature.

### Rationale
1. **User Journey Alignment**: Users navigate page-by-page
2. **Clear Boundaries**: Routes are well-defined split points
3. **Better Caching**: Each route cached independently
4. **Lazy Loading**: Pages load on-demand, not upfront
5. **Vite Support**: Vite's built-in code splitting works well with routes

### Consequences
**Positive**:
- Initial bundle reduced from 190 KB to 110 KB (42% smaller)
- Faster first paint and time to interactive
- Better caching strategy (route-level cache invalidation)
- Each feature team can optimize their routes independently

**Negative**:
- Some code duplication across routes (shared components)
- Slight delay when first navigating to a new route
- More bundles to manage (103 total)

**Mitigation**:
- Vendor chunks for shared dependencies
- Preload critical routes after auth
- Service worker caches route bundles

---

## ADR-005: Lazy Load Static Pages

**Status**: Accepted  
**Date**: 2026-02-09  
**Context**: Static pages (Terms, Privacy, etc.) rarely visited but included in initial bundle

### Decision
Convert static pages from eager to lazy loading.

### Rationale
1. **Low Usage**: Most users never visit Terms, Privacy, etc.
2. **Easy Win**: Simple change, significant impact
3. **No User Impact**: Slight delay acceptable for infrequent pages
4. **Consistent Pattern**: Aligns with route-based code splitting

### Consequences
**Positive**:
- ~30 KB removed from initial bundle
- Faster initial page load
- Static content loads on-demand

**Negative**:
- 100-200ms delay when first visiting these pages
- More network requests (one per static page)

**Mitigation**:
- Service worker caches static pages after first visit
- Loading indicator shows progress
- Small bundle sizes (<10 KB each) load quickly

---

## ADR-006: Granular Vendor Chunking

**Status**: Accepted  
**Date**: 2026-02-09  
**Context**: Large vendor bundles (React, UI libraries, charts) all loaded initially

### Decision
Split vendor bundles into smaller, more granular chunks based on usage patterns.

### Rationale
1. **Better Caching**: UI components cached separately from React core
2. **Lazy Load Heavy Deps**: Charts (374 KB) only loaded on analytics pages
3. **Parallel Loading**: Multiple smaller chunks load faster than one large
4. **Cache Invalidation**: Only invalidate changed chunks, not entire vendor bundle

### Consequences
**Positive**:
- Charts deferred (374 KB saved initially)
- Markdown deferred (160 KB saved initially)
- Better cache hit rates (granular invalidation)
- Faster updates (only changed chunks re-download)

**Negative**:
- More HTTP requests (multiple vendor chunks)
- Slightly more complex build configuration
- More bundles to track and monitor

**Mitigation**:
- HTTP/2 multiplexing handles multiple requests efficiently
- Vendor chunks change infrequently (99% cache hit rate)
- Bundle size monitoring in place

---

## ADR-007: No SSR/SSG for MVP

**Status**: Accepted  
**Date**: 2026-02-09  
**Context**: Could use Server-Side Rendering (SSR) or Static Site Generation (SSG) for better performance

### Decision
**Do not** implement SSR/SSG for the MVP. Keep client-side rendering (CSR).

### Rationale
1. **Time Constraint**: SSR/SSG requires significant refactoring
2. **Good Enough**: 110 KB initial bundle meets performance targets
3. **Complexity**: SSR adds server infrastructure, deployment complexity
4. **Features First**: Team should focus on user features, not infrastructure
5. **Progressive Enhancement**: Can add SSR later if needed

### Consequences
**Positive**:
- Simpler architecture (no server component)
- Faster development (no SSR to debug)
- Lower hosting costs (static files only)
- Easier deployments

**Negative**:
- Slower initial render (client-side only)
- SEO not optimal (but not a priority for logged-in app)
- No server-side data fetching (client fetches all data)

**Mitigation**:
- PWA caching for return visits
- Service worker for offline support
- Can revisit SSR in future if performance degrades

---

## ADR-008: Default-Deny RLS Posture

**Status**: Accepted  
**Date**: 2026-02-09  
**Context**: Need to ensure no data is accessible unless explicitly allowed

### Decision
All tables have RLS enabled with no default access. Every query requires an explicit policy match.

### Rationale
1. **Security First**: Deny by default, allow by exception
2. **Audit Friendly**: All access patterns are explicitly defined
3. **Fail-Safe**: Forgot to add a policy? Query fails (safe) vs. leaks data (unsafe)
4. **Compliance**: Meets strictest interpretation of COPPA/FERPA/GDPR

### Consequences
**Positive**:
- Cannot accidentally leak data
- All access patterns are documented in SQL
- Security audits are straightforward (review policies)
- Easy to add new restrictions (just don't add policy)

**Negative**:
- More policies to write and maintain
- Developer confusion if they forget to add policy
- Some queries slightly more complex (explicit ownership checks)

**Mitigation**:
- Documentation with examples (docs/RLS_DOCUMENTATION.md)
- Policy templates for common patterns
- Error messages guide developers to add missing policies

---

## ADR-009: Vitest Over Jest

**Status**: Accepted (Inherited)  
**Date**: 2026-02-09  
**Context**: Test framework choice for unit tests

### Decision
Use Vitest (already configured) rather than migrating to Jest.

### Rationale
1. **Already Configured**: Vitest already set up and working
2. **Vite Integration**: Vitest integrates seamlessly with Vite build
3. **Modern**: Vitest is newer, faster, better TypeScript support
4. **API Compatibility**: Vitest API is Jest-compatible (easy migration)
5. **Community**: Growing adoption, good documentation

### Consequences
**Positive**:
- No migration needed (save time)
- Fast test execution (<10 seconds)
- Good TypeScript support (no @types/jest issues)
- ESM support (modern module system)

**Negative**:
- Less mature than Jest (fewer plugins)
- Smaller community (fewer Stack Overflow answers)
- Some Jest plugins don't work with Vitest

**Mitigation**:
- Vitest documentation is excellent
- Most common use cases covered
- Can migrate to Jest later if needed (API compatible)

---

## ADR-010: Manual RLS Testing Over Automated

**Status**: Accepted  
**Date**: 2026-02-09  
**Context**: Need to verify RLS policies work correctly

### Decision
Use manual SQL-based testing for RLS policies rather than building an automated test suite.

### Rationale
1. **Time Constraint**: Automated test suite would take 1-2 weeks
2. **Simple Verification**: RLS tests are straightforward (run query, check results)
3. **Low Change Frequency**: RLS policies don't change often
4. **Documentation**: Test cases documented in RLS_DOCUMENTATION.md

### Consequences
**Positive**:
- Faster implementation (hours vs. weeks)
- Test cases documented for future reference
- Policies verified manually before deployment

**Negative**:
- No CI validation of RLS policies
- Risk of regression if policies change
- Manual testing prone to human error

**Mitigation**:
- Document test cases thoroughly
- Plan automated RLS test suite for future sprint
- Require manual RLS testing for any policy changes

---

## Summary of Key Decisions

| ADR | Decision | Impact |
|-----|----------|--------|
| 001 | Capacitor for mobile | Low complexity, high value |
| 002 | Unit tests focus | Fast coverage, good ROI |
| 003 | Database-level RLS | High security, compliance ready |
| 004 | Route-based code splitting | 42% bundle reduction |
| 005 | Lazy load static pages | 30 KB saved initially |
| 006 | Granular vendor chunks | 534 KB deferred (charts + markdown) |
| 007 | No SSR/SSG for MVP | Simpler architecture |
| 008 | Default-deny RLS | Maximum security |
| 009 | Vitest for tests | Fast, modern |
| 010 | Manual RLS testing | Pragmatic for MVP |

---

## Decision-Making Principles

These decisions were guided by:

1. **Time-Boxed Delivery**: 4-week constraint prioritized pragmatic solutions
2. **Risk Mitigation**: Security and compliance cannot be compromised
3. **Progressive Enhancement**: Build foundation now, optimize later
4. **Developer Experience**: Keep tooling simple and familiar
5. **User Experience**: Performance targets must be met

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-09  
**Review Cadence**: Quarterly
