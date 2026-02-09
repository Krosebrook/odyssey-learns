# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for Odyssey Learns platform. ADRs document significant architectural decisions, their context, rationale, and consequences.

## ADR Format

Each ADR follows this structure:
- **Title**: Brief, descriptive name
- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Context**: The situation and problem
- **Decision**: What was decided
- **Consequences**: Positive and negative outcomes
- **Alternatives Considered**: Other options evaluated

## Index

### Active ADRs
- [ADR-001: Vendor Independence Strategy](./ADR-001-vendor-independence-strategy.md) - Strategy for reducing platform vendor lock-in
- [ADR-002: TypeScript Adoption Strategy](./ADR-002-typescript-adoption-strategy.md) - Incremental TypeScript migration approach
- [ADR-003: Enterprise SSO Architecture](./ADR-003-enterprise-sso-architecture.md) - Azure AD and Okta integration design
- [ADR-004: CI/CD Pipeline Enhancement](./ADR-004-cicd-pipeline-enhancement.md) - GitHub Actions automation strategy

## Creating New ADRs

1. Copy the template: `cp ADR-000-template.md ADR-XXX-title.md`
2. Fill in all sections
3. Get team review
4. Update this README index
5. Commit with message: "docs: Add ADR-XXX - [Title]"

## References

- [Michael Nygard's ADR](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
