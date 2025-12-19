# Accessibility Guidelines - Inner Odyssey K-12

## WCAG 2.1 AA Compliance Status

### ✅ Perceivable

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.1.1 Non-text Content | ✅ Pass | All images have descriptive alt text |
| 1.2.1 Audio-only/Video-only | ✅ Pass | Captions available for video content |
| 1.3.1 Info and Relationships | ✅ Pass | Semantic HTML used throughout |
| 1.3.2 Meaningful Sequence | ✅ Pass | Logical reading order maintained |
| 1.4.1 Use of Color | ✅ Pass | Color is not sole indicator of meaning |
| 1.4.3 Contrast (Minimum) | ✅ Pass | 4.5:1 contrast ratio for text |
| 1.4.4 Resize Text | ✅ Pass | Text scales up to 200% without loss |
| 1.4.10 Reflow | ✅ Pass | Responsive design, no horizontal scroll |

### ✅ Operable

| Criterion | Status | Notes |
|-----------|--------|-------|
| 2.1.1 Keyboard | ✅ Pass | All interactive elements keyboard accessible |
| 2.1.2 No Keyboard Trap | ✅ Pass | Focus can be moved away from all elements |
| 2.2.1 Timing Adjustable | ✅ Pass | Session timeout has warnings |
| 2.3.1 Three Flashes | ✅ Pass | No flashing content |
| 2.4.1 Bypass Blocks | ✅ Pass | Skip links available |
| 2.4.2 Page Titled | ✅ Pass | Descriptive page titles |
| 2.4.3 Focus Order | ✅ Pass | Logical focus order |
| 2.4.4 Link Purpose | ✅ Pass | Link text is descriptive |
| 2.4.6 Headings and Labels | ✅ Pass | Descriptive headings used |
| 2.4.7 Focus Visible | ✅ Pass | 3px focus indicators |

### ✅ Understandable

| Criterion | Status | Notes |
|-----------|--------|-------|
| 3.1.1 Language of Page | ✅ Pass | `lang="en"` attribute set |
| 3.2.1 On Focus | ✅ Pass | No unexpected context changes |
| 3.2.2 On Input | ✅ Pass | Forms don't auto-submit |
| 3.3.1 Error Identification | ✅ Pass | Errors clearly identified |
| 3.3.2 Labels or Instructions | ✅ Pass | Form fields have labels |
| 3.3.3 Error Suggestion | ✅ Pass | Error messages provide guidance |

### ✅ Robust

| Criterion | Status | Notes |
|-----------|--------|-------|
| 4.1.1 Parsing | ✅ Pass | Valid HTML |
| 4.1.2 Name, Role, Value | ✅ Pass | ARIA attributes used correctly |

---

## Implementation Details

### Focus Management

```css
/* Global focus indicator - index.css */
*:focus-visible {
  outline: 3px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Skip Links

```tsx
// Added to AppLayout
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
>
  Skip to main content
</a>
```

### ARIA Labels

All icon-only buttons include `aria-label`:
```tsx
<Button aria-label="Close modal" variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>
```

### Screen Reader Announcements

Live regions for dynamic content:
```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {notification}
</div>
```

---

## Age-Tier Accessibility Considerations

### K-2 (Ages 5-7)
- Extra large touch targets (64px minimum)
- Simple, predictable navigation
- Audio support for all instructions
- High contrast colors with reduced animations option

### 3-5 (Ages 8-10)
- Large touch targets (52px minimum)
- Visual + text feedback for all actions
- Clear error messages with icons

### 6-8 (Ages 11-13)
- Standard touch targets (48px)
- Keyboard shortcuts available
- Detailed error messages

### 9-12 (Ages 14-18)
- Professional touch targets (44px)
- Full keyboard navigation
- Advanced accessibility settings

---

## Testing Procedures

### Automated Testing
```bash
# Run accessibility tests with Playwright + Axe
npm run test:e2e -- e2e/accessibility.spec.ts
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test Enter/Space activation
- [ ] Test Escape to close modals
- [ ] Verify no keyboard traps

#### Screen Reader Testing

**VoiceOver (macOS/iOS)**
1. Enable: `Cmd + F5`
2. Navigate with `VO + Arrow keys`
3. Verify all content is announced
4. Check form labels are read

**NVDA (Windows)**
1. Download from nvaccess.org
2. Navigate with arrow keys
3. Use `Tab` for interactive elements
4. Verify landmarks are announced

**TalkBack (Android)**
1. Enable in Settings > Accessibility
2. Swipe to navigate
3. Double-tap to activate
4. Verify content descriptions

#### Color Contrast Testing
- Use browser DevTools (Chrome Lighthouse)
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Verify 4.5:1 for normal text, 3:1 for large text

#### Reduced Motion Testing
```css
/* Verify animations respect user preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Known Issues & Roadmap

### Current Limitations
1. Some complex charts may need additional descriptions
2. Video player controls could have better keyboard support

### Planned Improvements (Q2 2025)
- [ ] OpenDyslexic font option
- [ ] High contrast mode toggle
- [ ] Voice navigation ("Hey Odyssey")
- [ ] Adjustable animation speeds

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Axe DevTools](https://www.deque.com/axe/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

---

## Contact

For accessibility issues or suggestions, contact:
- Email: accessibility@innerodyssey.com
- In-app: Beta Feedback Widget → Category: "Accessibility"
