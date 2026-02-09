# ADR-002: TypeScript Adoption Strategy

**Status**: Accepted  
**Date**: 2026-02-09  
**Decision Makers**: Platform Architecture Team  
**Consulted**: Frontend Team, QA Team  
**Informed**: All Engineering Teams

## Context

Odyssey Learns is **already ~90% TypeScript** with 90+ TypeScript files across the codebase. The project uses TypeScript 5.8 with Vite as the build tool.

**Current TypeScript Configuration**:
- `tsconfig.json` - Base config (loose: `noImplicitAny: false`, `noUnusedLocals: false`)
- `tsconfig.app.json` - Application config (target ES2020, `strict: false`)
- `tsconfig.node.json` - Node/build tools config
- `tsconfig.strict.json` - Strict mode for selected modules (lib/, hooks/, types/)

**Current Coverage**:
- ✅ All React components: TypeScript
- ✅ All hooks: TypeScript with strict mode
- ✅ All library code: TypeScript with strict mode
- ✅ Supabase edge functions: TypeScript (Deno)
- ✅ Type definitions: Auto-generated from Supabase schema
- ⚠️ Application code: TypeScript with **permissive settings**

**The Challenge**:
While the codebase is technically TypeScript, **strict mode is not enabled globally**. This means:
- `any` types are allowed without explicit annotation
- Unused locals and parameters are not flagged
- Null checks are not enforced (`strictNullChecks: false`)
- Some type safety benefits are not realized

**The Goal**:
- Strengthen TypeScript usage incrementally
- Enable strict mode across the entire codebase
- Maintain development velocity
- Align with Q2-Q3 2026 roadmap

## Decision

We will adopt a **Progressive Strictness Strategy** that incrementally increases TypeScript strictness without disrupting development:

### 1. Phased Strict Mode Adoption (6-Month Timeline)

#### Phase 1: Immediate Wins (Month 1)
Enable low-friction strict options that catch real bugs:
```json
{
  "compilerOptions": {
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### Phase 2: Explicit Typing (Months 2-3)
Eliminate implicit `any`:
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```
- Fix existing `any` types in application code
- Add explicit types to function parameters
- Target: 100 files per month

#### Phase 3: Unused Code Detection (Months 3-4)
Enable cleanliness rules:
```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```
- Clean up unused imports and variables
- Remove dead code
- Improve code maintainability

#### Phase 4: Null Safety (Months 4-6)
The most impactful but challenging:
```json
{
  "compilerOptions": {
    "strictNullChecks": true
  }
}
```
- Add null/undefined checks throughout application
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Target: Most critical paths first (auth, payments, data mutations)

#### Phase 5: Full Strict Mode (Month 6)
Complete the transition:
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 2. Module-by-Module Approach

Use TypeScript 5.0+ **project references** to enable strict mode per module:

```
src/
├── lib/          ✅ ALREADY STRICT (tsconfig.strict.json)
├── hooks/        ✅ ALREADY STRICT
├── types/        ✅ ALREADY STRICT
├── components/   🔧 PHASE 2-3 (critical UI components)
├── pages/        🔧 PHASE 3-4 (page components)
├── integrations/ ✅ ALREADY STRICT (Supabase types)
```

**Strategy**: 
- Critical business logic first (auth, payments, data handling)
- UI components second (forms, dialogs, navigation)
- Page components last (composition, less type-critical)

### 3. Team Enablement

**Training & Documentation**:
- Create TypeScript best practices guide (Week 1)
- Weekly "TypeScript Office Hours" (30 min, Fridays)
- Update code review checklist to include type safety
- Celebrate wins in team meetings

**Tooling Support**:
- Enable TypeScript ESLint rules gradually
- Add pre-commit hooks for strict files
- Create type coverage reporting dashboard
- Integrate `ts-prune` for unused export detection

**Gradual Rollout**:
- No "big bang" rewrite mandates
- Developers enable strict mode when touching files
- New code **must** use strict settings
- Migration tracked via GitHub project board

### 4. CI/CD Integration

**Build Pipeline**:
```yaml
# .github/workflows/typescript-check.yml
- name: TypeScript Type Check
  run: npx tsc --noEmit
  
- name: Strict Mode Coverage Report
  run: npx type-coverage --at-least 80
```

**Quality Gates**:
- Minimum 80% type coverage (current: ~75%)
- Increase by 5% per month
- Block PR if type coverage decreases
- Track progress in CI dashboard

## Rationale

### Why Progressive (Not Big Bang)?

**Big bang rewrites fail**:
- 3-6 months of zero feature delivery
- Merge conflicts nightmare
- Team burnout
- High risk of introducing bugs
- Business impact unacceptable

**Progressive adoption succeeds**:
- Continue shipping features
- Learn and adjust approach
- Lower risk, easier rollback
- Team builds TypeScript skills gradually
- Business value maintained throughout

### Why This Timeline?

**6 months is realistic**:
- 90+ TypeScript files to strengthen
- ~500-1000 locations to add explicit types
- ~200-300 null safety fixes estimated
- Parallel with feature development
- Time for team learning curve

**Front-loaded easy wins**:
- Month 1 changes catch bugs immediately
- Builds team confidence in process
- Low disruption to feature work

### Why Strict Mode Matters

**Type safety prevents production bugs**:
- Null reference errors (40% of production bugs)
- Incorrect function signatures (20% of integration bugs)
- Missing error handling (15% of user-facing errors)

**Developer productivity gains**:
- Better IntelliSense and autocomplete
- Refactoring confidence
- Earlier bug detection (dev vs production)
- Self-documenting code

**Cost savings**:
- 1 hour of TypeScript fixes = 5-10 hours of production debugging
- Reduced QA time for regression testing
- Lower support ticket volume

## Consequences

### Positive
- **Fewer production bugs**: Null checks and explicit types catch errors at compile-time
- **Better IntelliSense**: Improved autocomplete and documentation
- **Refactoring confidence**: Type checker validates changes across codebase
- **Onboarding speed**: New developers understand types immediately
- **Code quality**: Forces explicit handling of edge cases
- **Maintenance ease**: Types serve as living documentation

### Negative
- **Initial slowdown**: Developers need time to add types (estimated 10-15% slower for 2-3 months)
- **Learning curve**: Junior developers need TypeScript training
- **Friction**: Some developers resist strictness ("it slows me down")
- **Legacy code**: Old files may need significant refactoring
- **Build time**: Slightly longer TypeScript compilation (currently ~5s, may increase to ~8s)
- **Complex types**: Some React patterns require advanced TypeScript knowledge

### Neutral
- **Not a silver bullet**: Types don't prevent all bugs (logic errors, off-by-one, etc.)
- **Trade-off**: More upfront design vs faster prototyping
- **Team preference**: Some developers love types, others tolerate them

## Alternatives Considered

### Alternative 1: JavaScript with JSDoc
**Description**: Stay with JavaScript, add type annotations via JSDoc comments

```javascript
/**
 * @param {string} userId
 * @param {number} lessonId
 * @returns {Promise<Lesson>}
 */
async function getLesson(userId, lessonId) {
  // ...
}
```

**Pros**:
- No build step complexity
- Gradual adoption possible
- Works with existing tooling

**Cons**:
- Verbose and harder to read
- No compile-time enforcement
- Poor refactoring support
- Less ecosystem support

**Why not chosen**: Already committed to TypeScript, JSDoc is a step backward. Would require rewriting 90+ TypeScript files to JavaScript.

### Alternative 2: Full Strict Mode Immediately
**Description**: Enable `strict: true` everywhere, fix all errors in one sprint

**Pros**:
- Fastest to "done"
- No half-measures
- Clear completion criteria

**Cons**:
- Estimated 3-4 weeks of zero feature delivery
- High risk of regression bugs
- Team burnout
- Business stakeholder frustration
- Massive merge conflicts

**Why not chosen**: **Unacceptable business risk**. Q2 2026 has critical features (parent dashboard v2, mobile app beta). Cannot afford 3-4 week feature freeze.

### Alternative 3: Stay with Current Permissive Settings
**Description**: Keep TypeScript with loose settings, focus on feature delivery

**Pros**:
- Zero migration effort
- Fastest development velocity
- No team disruption

**Cons**:
- Miss type safety benefits (why use TypeScript?)
- Accumulating type debt
- Production bugs from null references
- Poor refactoring confidence

**Why not chosen**: **Not achieving TypeScript's value**. Current setup is "TypeScript lite" - getting build tooling complexity without safety benefits. Production null reference errors cost 5-10 hours each to debug.

### Alternative 4: Rewrite in Different Language (Rust, Go, etc.)
**Description**: Abandon TypeScript/JavaScript, rewrite frontend in type-safe language

**Pros**:
- Compile-time guarantees
- Performance benefits
- Modern language features

**Cons**:
- 12-18 month rewrite estimate
- Lose React ecosystem
- No browser support for Rust/Go (WASM too immature)
- Team needs complete retrain
- Business impact catastrophic

**Why not chosen**: **Complete non-starter**. Browser platform is JavaScript/TypeScript. This isn't a realistic option.

## Implementation Notes

### Phase 1: Immediate Wins (Month 1 - Feb 2026)

**Week 1**:
1. Create `tsconfig.strict-phase1.json`:
```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

2. Run type check: `npx tsc --noEmit`
3. Fix errors (estimated: 10-20 locations)
4. Update CI to use new config

**Week 2-4**:
- Monitor for regressions
- Team training: "TypeScript Best Practices"
- Create migration guide document
- Set up type coverage dashboard

### Phase 2: Explicit Typing (Months 2-3 - Mar-Apr 2026)

**Target**: Enable `noImplicitAny`, fix 100 files/month

**Approach**:
1. Enable rule in specific directories first:
   - `src/components/auth/` (Week 1)
   - `src/components/learning/` (Week 2-3)
   - `src/components/parent/` (Week 4-5)
   - `src/pages/` (Week 6-8)

2. Automated fixes where possible:
```bash
# Use AI-assisted tools
npx ts-migrate src/components/auth
```

3. Manual review and refinement

**Success Metric**: Type coverage increases from 75% to 85%

### Phase 3: Unused Code Detection (Months 3-4 - Apr-May 2026)

**Target**: Enable `noUnusedLocals`, `noUnusedParameters`

**Approach**:
1. Run with reporting only (don't fail build)
2. Create cleanup sprint (2 days)
3. Remove unused imports, variables, parameters
4. Enable in CI as warning (Month 3), error (Month 4)

**Expected Impact**: Remove 500-1000 lines of dead code

### Phase 4: Null Safety (Months 4-6 - May-Jul 2026)

**Target**: Enable `strictNullChecks`

**Approach**:
1. Critical paths first:
   - Authentication flows (Week 1-2)
   - Payment/subscription logic (Week 3)
   - Data mutations (Week 4-5)
   - UI components (Week 6-8)

2. Use discriminated unions for error handling:
```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

3. Leverage optional chaining:
```typescript
// Before
if (user && user.profile && user.profile.name) {
  return user.profile.name;
}

// After
return user?.profile?.name ?? "Guest";
```

**Expected Impact**: Eliminate 80% of null reference production bugs

### Phase 5: Full Strict Mode (Month 6 - Jul 2026)

**Target**: Enable `strict: true` globally

**Final checklist**:
- [ ] All application code has explicit types
- [ ] No `any` types without `@ts-expect-error` justification
- [ ] Null checks throughout
- [ ] Type coverage ≥ 90%
- [ ] CI enforces strict mode
- [ ] Team trained and confident

### Rollback Strategy

If strict mode causes unacceptable velocity loss:
1. **Revert specific rule**: Disable one strict option (e.g., strictNullChecks)
2. **Pause migration**: Focus on feature delivery for 1-2 sprints
3. **Re-evaluate timeline**: Extend from 6 to 9-12 months
4. **Scope reduction**: Keep strict mode only on lib/ and hooks/

**Trigger points**:
- Feature velocity drops >30% for 2+ sprints
- Team satisfaction scores drop significantly
- Business stakeholders escalate concerns

### Success Criteria

**Quantitative**:
- [ ] Type coverage ≥ 90% (measured by `type-coverage`)
- [ ] Zero `any` types without justification
- [ ] 100% of new code uses strict mode
- [ ] Build passes with `strict: true`
- [ ] Production null reference errors reduced by 80%

**Qualitative**:
- [ ] Team reports improved refactoring confidence
- [ ] Code reviews faster (types self-document)
- [ ] Onboarding time for new developers reduced
- [ ] Fewer "how do I use this API?" questions

**Business**:
- [ ] No feature delivery delays attributed to TypeScript migration
- [ ] Production bug rate decreases
- [ ] Customer support tickets reduced

## Team Resources

### TypeScript Best Practices Guide

**To be created**: `docs/TYPESCRIPT_GUIDELINES.md`

Topics:
- When to use `interface` vs `type`
- Discriminated unions for state management
- Generic type constraints
- Utility types (`Partial`, `Pick`, `Omit`, etc.)
- Zod for runtime validation + TypeScript types
- React TypeScript patterns

### Weekly Office Hours

**Time**: Fridays 3-3:30 PM  
**Format**: Q&A, code review, pair programming  
**Topics**: Rotating based on team needs

### Code Review Checklist

Add to PR template:
- [ ] No `any` types without justification (`@ts-expect-error` with comment)
- [ ] Function parameters have explicit types
- [ ] Return types are explicit (not inferred)
- [ ] Null/undefined handled explicitly (`?`, `??`, type guards)
- [ ] Types are reused (not duplicated)

## Monitoring & Metrics

### Type Coverage Dashboard

**Tool**: `type-coverage` npm package

```bash
npx type-coverage --detail
```

**Targets**:
- Month 0: 75% (baseline)
- Month 2: 80%
- Month 4: 85%
- Month 6: 90%+

### Production Error Tracking

**Track by category**:
- Null reference errors
- Type coercion bugs
- Missing error handling

**Expected reduction**: 80% by Month 6

### Developer Satisfaction

**Monthly survey**:
1. "TypeScript strictness helps me catch bugs early" (1-5)
2. "I feel confident refactoring code" (1-5)
3. "Type errors are clear and actionable" (1-5)

**Target**: Average ≥ 4.0 by Month 6

## References

- [TypeScript Handbook - Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Matt Pocock - TypeScript Tips](https://www.totaltypescript.com/)
- [Effective TypeScript (Book)](https://effectivetypescript.com/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- Current configs: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.strict.json`

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-09 | Platform Architecture Team | Initial draft and acceptance |
