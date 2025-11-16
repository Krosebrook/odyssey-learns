import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useValidatedChild } from '../useValidatedChild';
import { mockSupabaseClient } from '@/test/mocks/supabase';

// Mock useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-parent-id', email: 'test@example.com' },
    session: { access_token: 'mock-token' },
    loading: false,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useValidatedChild', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with null childId when no stored value', async () => {
    const { result } = renderHook(() => useValidatedChild());
    
    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.childId).toBeNull();
  });

  it('should validate stored childId against server', async () => {
    const mockChildId = 'test-child-id';
    localStorage.setItem('selectedChildId', mockChildId);

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ 
        data: { id: mockChildId }, 
        error: null 
      })),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    });

    const { result } = renderHook(() => useValidatedChild());

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.childId).toBe(mockChildId);
  });

  it('should clear invalid childId and navigate away', async () => {
    const invalidChildId = 'invalid-child-id';
    localStorage.setItem('selectedChildId', invalidChildId);

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Not found' } 
      })),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    });

    const { result } = renderHook(() => useValidatedChild());

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.childId).toBeNull();
    expect(localStorage.getItem('selectedChildId')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should validate child ownership before selecting', async () => {
    const newChildId = 'new-child-id';

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ 
        data: { id: newChildId }, 
        error: null 
      })),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    });

    const { result } = renderHook(() => useValidatedChild());

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    const success = await result.current.selectChild(newChildId);

    expect(success).toBe(true);
    expect(localStorage.getItem('selectedChildId')).toBe(newChildId);
    expect(result.current.childId).toBe(newChildId);
  });

  it('should reject selecting child without ownership', async () => {
    const unauthorizedChildId = 'unauthorized-child-id';

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Not found' } 
      })),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    });

    const { result } = renderHook(() => useValidatedChild());

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    const success = await result.current.selectChild(unauthorizedChildId);

    expect(success).toBe(false);
    expect(localStorage.getItem('selectedChildId')).toBeNull();
  });
});
