import { vi } from 'vitest';

export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
  functions: {
    invoke: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
    })),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));
