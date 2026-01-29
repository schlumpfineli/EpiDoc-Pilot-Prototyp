import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders input field', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter name" />);
    expect(screen.getByPlaceholderText(/enter name/i)).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('displays helper text', () => {
    render(<Input helperText="Enter your full name" />);
    expect(screen.getByText(/enter your full name/i)).toBeInTheDocument();
  });

  it('does not display helper text when error is present', () => {
    render(<Input error="Error" helperText="Helper text" />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.queryByText(/helper text/i)).not.toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<Input label="Email" required />);
    const label = screen.getByText(/email/i);
    expect(label).toHaveTextContent('*');
  });

  it('can be typed into', async () => {
    const user = userEvent.setup();
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'Test input');
    
    expect(input).toHaveValue('Test input');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-input');
  });

  it('supports different input types', () => {
    const { container } = render(<Input type="email" />);
    const input = container.querySelector('input[type="email"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
  });

  it('supports password type', () => {
    const { container } = render(<Input type="password" />);
    const input = container.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('can be disabled', () => {
    const { container } = render(<Input disabled />);
    const input = container.querySelector('input');
    expect(input).toBeDisabled();
  });
});

