import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple test component for demonstration
const TestComponent = () => (
  <div>
    <h1>Fashion AI App</h1>
    <button>Click me</button>
  </div>
);

describe('Basic Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the header text', () => {
    render(<TestComponent />);
    const heading = screen.getByRole('heading', { name: /Fashion AI App/i });
    expect(heading).toBeInTheDocument();
  });

  it('should render a button', () => {
    render(<TestComponent />);
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should verify button is clickable', () => {
    const handleClick = vi.fn();
    const ClickableComponent = () => (
      <button onClick={handleClick}>Click me</button>
    );
    
    render(<ClickableComponent />);
    const button = screen.getByRole('button', { name: /Click me/i });
    
    button.click();
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
