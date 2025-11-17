# Compliance Documentation

## Overview
Inner Odyssey is committed to protecting children's privacy and maintaining compliance with relevant regulations. This document outlines our approach to COPPA, FERPA, and GDPR compliance.

---

## COPPA Compliance (Children's Online Privacy Protection Act)

### Applicability
Inner Odyssey serves children under 13 years old, making COPPA compliance mandatory.

### Key Requirements & Implementation

#### 1. Parental Consent ✅
- **Requirement**: Obtain verifiable parental consent before collecting personal information from children under 13
- **Implementation**:
  - Parent account required before child profile creation
  - Parent email verification at signup
  - Parent must explicitly create child profiles (no self-signup for children)
  - Parent controls all settings and data access

#### 2. Privacy Policy ✅
- **Requirement**: Clear privacy policy explaining data collection practices
- **Location**: `/privacy` page accessible from all authenticated pages
- **Coverage**:
  - Types of information collected (name, grade level, learning progress)
  - How information is used (personalized learning, progress tracking)
  - No third-party data sharing
  - No advertising or marketing to children

#### 3. Parental Access & Control ✅
- **Implementation**:
  - Parent dashboard with full visibility into child activity
  - Ability to review all collected information
  - Option to delete child account and all associated data
  - Screen time controls and content filtering
  - Review and approve child-generated content before sharing

#### 4. Data Minimization ✅
- **Collection Limited To**:
  - Child's first name (no last name required)
  - Grade level
  - Learning progress and activity data
  - Emotional check-in data (parent-visible, encrypted at rest)
- **NOT Collected**:
  - Child's email, phone, or address
  - Location data beyond timezone
  - Social security or government ID numbers
  - Biometric data

#### 5. Data Security ✅
- **Measures**:
  - Encrypted data transmission (TLS 1.3)
  - Row-level security (RLS) policies on all tables
  - Parent-only access to child data via authenticated sessions
  - Emotion log data encrypted at rest
  - Regular security audits and vulnerability scanning

#### 6. Data Retention ✅
- **Policy**:
  - Data retained only as long as necessary for educational purposes
  - Parents can request deletion at any time
  - Automatic cleanup of old error logs (90-day retention)
  - Session data cleaned after inactivity

---

## FERPA Compliance (Family Educational Rights and Privacy Act)

### Applicability
While Inner Odyssey is not a formal educational institution, we follow FERPA principles for educational data protection.

### Key Principles & Implementation

#### 1. Educational Records Protection ✅
- **Records Include**:
  - Lesson completion data
  - Quiz scores and performance metrics
  - Learning progress and skill mastery
  - Teacher/parent notes and feedback
- **Protection**:
  - Only parents can access child's educational records
  - No sharing with third parties without parental consent
  - Secure storage with RLS policies

#### 2. Parent Rights ✅
- **Parents Can**:
  - View all educational records
  - Request corrections to inaccurate data
  - Download complete data export (CSV/JSON)
  - Delete all records upon account closure

#### 3. Directory Information
- **Not Applicable**: Inner Odyssey does not share any "directory information" publicly
- **No Public Profiles**: All child profiles are private by default

---

## GDPR Considerations (General Data Protection Regulation)

### Applicability
GDPR applies if we serve users in the European Union (future consideration).

### Key Rights & Implementation Status

#### 1. Right to Access ✅
- **Implementation**: Parent dashboard provides full data visibility
- **Export**: Database export functionality available

#### 2. Right to Erasure (Right to be Forgotten) ✅
- **Implementation**: Account deletion button in settings
- **Scope**: Deletes all child data, parent data, progress, and logs

#### 3. Right to Data Portability ✅
- **Implementation**: Export data in machine-readable format (JSON/CSV)
- **Scope**: All educational records, progress data, and activity logs

#### 4. Right to Rectification ✅
- **Implementation**: Parents can edit child profiles and data
- **Scope**: Name, grade level, preferences, avatar

#### 5. Consent Management ✅
- **Implementation**:
  - Explicit parental consent at account creation
  - Opt-in for optional features (weekly reports, notifications)
  - Clear consent language in privacy policy

#### 6. Data Protection by Design ✅
- **Measures**:
  - Privacy-first architecture
  - Minimal data collection
  - Pseudonymization where possible (child username vs. real name)
  - Encryption at rest and in transit

---

## Data Processing Agreement (DPA)

### Third-Party Services
Currently, Inner Odyssey uses the following third-party services:

#### Supabase (Backend Infrastructure)
- **Service**: Database, authentication, storage, edge functions
- **Data Processed**: All user data, educational records, session data
- **Compliance**: Supabase is SOC 2 Type II certified, GDPR compliant
- **Agreement**: Supabase's DPA covers our data processing requirements
- **Data Location**: US-based servers (configurable for EU in future)

#### OpenAI (AI-Generated Content)
- **Service**: Lesson content generation (admin-only feature)
- **Data Processed**: Lesson prompts (no child PII sent to OpenAI)
- **Compliance**: OpenAI API terms prohibit using child data for model training
- **Implementation**: API calls made from edge functions, no child-identifiable data included

### Data Flow Diagram
```
Parent/Child Browser 
  ↓ (TLS 1.3 encrypted)
Lovable Cloud Frontend
  ↓ (Authenticated API calls)
Supabase Backend (RLS enforced)
  ↓ (Admin-only, no PII)
OpenAI API (Lesson generation only)
```

---

## Age Verification

### Current Implementation
- **Parent-Gated**: Children cannot self-register; parent account required
- **Grade Level**: Used as proxy for age (Kindergarten = ~5 years old)
- **No Direct Age Entry**: Reduces friction while maintaining COPPA compliance

### Future Enhancements (Post-Launch)
- Optional birthdate entry for more accurate age-adaptive content
- Enhanced parental verification (credit card, ID verification services)

---

## Incident Response Plan

### Data Breach Protocol
1. **Detection**: Automated monitoring via error logs and security access logs
2. **Containment**: Immediate lockdown of affected systems
3. **Assessment**: Determine scope (how many users, what data exposed)
4. **Notification**: 
   - Parents notified within 72 hours (GDPR requirement)
   - Authorities notified if legally required
   - Public disclosure if >500 accounts affected
5. **Remediation**: Patch vulnerabilities, enhance security measures
6. **Post-Mortem**: Document lessons learned, update security practices

### Contact for Security Issues
- **Email**: security@innerodyssey.com (to be set up)
- **Bug Bounty**: Consider HackerOne program post-launch
- **Disclosure Policy**: See `/public/.well-known/security.txt`

---

## Privacy Policy Updates

### Change Notification
- Parents notified via email 30 days before material changes
- Continued use constitutes acceptance
- Option to delete account if disagree with changes

### Last Updated
- Current privacy policy: January 2025 (pre-launch)
- Review schedule: Quarterly during Year 1, annually thereafter

---

## Compliance Checklist (Pre-Launch)

### COPPA
- [x] Parental consent mechanism implemented
- [x] Privacy policy published and accessible
- [x] Data minimization implemented
- [x] Parental access controls functional
- [x] Data security measures in place
- [ ] Privacy policy reviewed by legal counsel (recommended)
- [ ] FTC COPPA safe harbor certification (optional, post-launch)

### FERPA
- [x] Educational records access controls implemented
- [x] Parent rights documented and functional
- [x] No unauthorized disclosure mechanisms
- [ ] Staff training on FERPA principles (if hiring team)

### GDPR (If serving EU users)
- [x] Data access and export functionality
- [x] Right to erasure implemented
- [x] Consent management implemented
- [ ] EU data residency option (future)
- [ ] Data Protection Officer appointed (if >250 employees or high-risk processing)
- [ ] GDPR compliance audit by external firm (recommended)

---

## Audit Trail

### Compliance Reviews
- **2025-01-17**: Initial compliance documentation created (Day 10)
- **Next Review**: 2025-04-17 (Q2 2025)

### Changes to Data Practices
- **2025-01-17**: Initial launch configuration (parent-gated, minimal data collection)

---

## Additional Resources

### Regulatory Guidance
- [FTC COPPA Compliance Guide](https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa-frequently-asked-questions)
- [US Dept of Education FERPA](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)
- [GDPR Official Text](https://gdpr-info.eu/)

### Industry Standards
- NIST Cybersecurity Framework
- OWASP Top 10 for Web Applications
- CIS Controls for K-12 Educational Technology

---

**Status**: ✅ Compliant (with recommendations for legal review before public launch)  
**Last Updated**: 2025-01-17  
**Next Review**: 2025-04-17 (90 days post-launch)
