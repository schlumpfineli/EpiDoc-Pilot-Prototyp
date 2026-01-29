import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/protected',
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test User', email: 'test@example.com' },
      isLoading: false,
      isAuthenticated: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText(/protected content/i)).toBeInTheDocument();
    });
  });

  it('shows loading state when checking authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to custom path when provided', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });

    render(
      <ProtectedRoute redirectTo="/custom-login">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-login');
    });
  });

  it('allows access when role matches', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'patient' },
      isLoading: false,
      isAuthenticated: true,
    });

    render(
      <ProtectedRoute requireRole="patient">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText(/protected content/i)).toBeInTheDocument();
    });
  });

  it('redirects when role does not match', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'relative' },
      isLoading: false,
      isAuthenticated: true,
    });

    render(
      <ProtectedRoute requireRole="patient">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});

