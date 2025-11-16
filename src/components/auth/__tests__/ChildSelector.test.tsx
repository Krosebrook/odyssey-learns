import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { ChildSelector } from '../ChildSelector';

describe('ChildSelector', () => {
  const mockChildren = [
    {
      id: 'child-1',
      name: 'Alice',
      grade_level: 2,
      avatar_config: {},
      total_points: 150,
    },
    {
      id: 'child-2',
      name: 'Bob',
      grade_level: 5,
      avatar_config: {},
      total_points: 250,
    },
  ];

  it('should render all children', () => {
    const mockOnSelect = vi.fn();
    render(<ChildSelector children={mockChildren} onSelect={mockOnSelect} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should display child grade level', () => {
    const mockOnSelect = vi.fn();
    render(<ChildSelector children={mockChildren} onSelect={mockOnSelect} />);

    expect(screen.getByText('Grade 2')).toBeInTheDocument();
    expect(screen.getByText('Grade 5')).toBeInTheDocument();
  });

  it('should display child points', () => {
    const mockOnSelect = vi.fn();
    render(<ChildSelector children={mockChildren} onSelect={mockOnSelect} />);

    expect(screen.getByText('150 points')).toBeInTheDocument();
    expect(screen.getByText('250 points')).toBeInTheDocument();
  });

  it('should call onSelect when child is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();
    render(<ChildSelector children={mockChildren} onSelect={mockOnSelect} />);

    const aliceCard = screen.getByText('Alice').closest('div[class*="cursor-pointer"]');
    if (aliceCard) {
      await user.click(aliceCard);
    }

    expect(mockOnSelect).toHaveBeenCalledWith('child-1');
  });

  it('should render empty when no children', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(<ChildSelector children={[]} onSelect={mockOnSelect} />);

    const cards = container.querySelectorAll('[class*="cursor-pointer"]');
    expect(cards.length).toBe(0);
  });

  it('should apply hover effects', () => {
    const mockOnSelect = vi.fn();
    render(<ChildSelector children={mockChildren} onSelect={mockOnSelect} />);

    const aliceCard = screen.getByText('Alice').closest('div[class*="hover-scale"]');
    expect(aliceCard).toBeInTheDocument();
  });
});
