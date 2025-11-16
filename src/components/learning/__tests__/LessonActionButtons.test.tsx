import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { LessonActionButtons } from '../LessonActionButtons';
import * as lessonAnalytics from '@/hooks/useLessonAnalytics';

Object.assign(navigator, {
  clipboard: { writeText: vi.fn(() => Promise.resolve()) },
});

vi.mock('@/hooks/useLessonAnalytics', () => ({
  trackLessonSave: vi.fn(),
  trackLessonShare: vi.fn(),
}));

describe('LessonActionButtons', () => {
  const mockProps = { lessonId: 'lesson-123', childId: 'child-123' };

  beforeEach(() => vi.clearAllMocks());

  it('should render save and share buttons', () => {
    render(<LessonActionButtons {...mockProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('should track save when clicked', async () => {
    const user = userEvent.setup();
    const trackSaveSpy = vi.spyOn(lessonAnalytics, 'trackLessonSave');
    render(<LessonActionButtons {...mockProps} />);
    await user.click(screen.getByText('Save'));
    await waitFor(() => expect(trackSaveSpy).toHaveBeenCalled());
  });
});
