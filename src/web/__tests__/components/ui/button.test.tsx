import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it } from '@jest/globals';
import { Button, buttonVariants } from '../../../components/ui/button';

describe('Button component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-indigo-600', 'text-white');
    expect(button).toHaveTextContent('Click me');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    
    let button = screen.getByRole('button', { name: /primary/i });
    expect(button).toHaveClass('bg-indigo-600', 'text-white');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-pink-500', 'text-white');
    
    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button', { name: /outline/i });
    expect(button).toHaveClass('border', 'border-gray-300', 'bg-white');
    
    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button', { name: /ghost/i });
    expect(button).toHaveClass('text-gray-700');
    
    rerender(<Button variant="link">Link</Button>);
    button = screen.getByRole('button', { name: /link/i });
    expect(button).toHaveClass('text-indigo-600', 'underline-offset-4');
    
    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByRole('button', { name: /danger/i });
    expect(button).toHaveClass('bg-red-500', 'text-white');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    
    let button = screen.getByRole('button', { name: /default/i });
    expect(button).toHaveClass('h-10', 'px-4', 'py-2');
    
    rerender(<Button size="sm">Small</Button>);
    button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('h-9', 'px-3', 'py-1', 'text-xs');
    
    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveClass('h-11', 'px-8', 'py-3', 'text-base');
    
    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole('button', { name: /icon/i });
    expect(button).toHaveClass('h-10', 'w-10', 'p-2');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    
    // Check for loading spinner with specific classes
    const loadingIcon = document.querySelector('.mr-2.h-4.w-4.animate-spin');
    expect(loadingIcon).toBeInTheDocument();
    expect(loadingIcon).toHaveAttribute('aria-hidden', 'true');
    
    // Check that the button text is still present
    expect(button).toHaveTextContent('Loading');
  });

  it('shows loading text when provided', () => {
    render(<Button isLoading loadingText="Please wait">Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    // Check for loading spinner
    const loadingIcon = document.querySelector('.animate-spin');
    expect(loadingIcon).toBeInTheDocument();
    
    // Check that the loading text is shown instead of original text
    expect(button).not.toHaveTextContent('Submit');
    expect(button).toHaveTextContent('Please wait');
  });

  it('forwards ref to the button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Button with ref</Button>);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  it('renders as a child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>
    );
    
    const linkButton = screen.getByRole('link', { name: /link button/i });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute('href', 'https://example.com');
    
    // Check that the link has button classes
    expect(linkButton).toHaveClass('inline-flex', 'items-center', 'justify-center', 'rounded-md');
  });

  it('applies additional className correctly', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    
    const button = screen.getByRole('button', { name: /custom button/i });
    expect(button).toHaveClass('custom-class');
    // Also has default classes
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('buttonVariants generates correct class names', () => {
    // Test default variant and size
    const defaultClasses = buttonVariants();
    expect(defaultClasses).toContain('bg-indigo-600');
    expect(defaultClasses).toContain('text-white');
    expect(defaultClasses).toContain('h-10');
    
    // Test specific variants
    const secondaryClasses = buttonVariants({ variant: 'secondary' });
    expect(secondaryClasses).toContain('bg-pink-500');
    expect(secondaryClasses).not.toContain('bg-indigo-600'); // Ensure it's not containing primary variant classes
    
    const outlineClasses = buttonVariants({ variant: 'outline' });
    expect(outlineClasses).toContain('border');
    expect(outlineClasses).toContain('bg-white');
    expect(outlineClasses).not.toContain('bg-indigo-600');
    
    // Test specific sizes
    const smallClasses = buttonVariants({ size: 'sm' });
    expect(smallClasses).toContain('h-9');
    expect(smallClasses).toContain('px-3');
    expect(smallClasses).not.toContain('h-10'); // Ensure it's not containing default size classes
    
    const largeClasses = buttonVariants({ size: 'lg' });
    expect(largeClasses).toContain('h-11');
    expect(largeClasses).toContain('px-8');
    expect(largeClasses).not.toContain('h-10');
    
    // Test combination
    const combinedClasses = buttonVariants({ variant: 'outline', size: 'lg' });
    expect(combinedClasses).toContain('border');
    expect(combinedClasses).toContain('h-11');
    expect(combinedClasses).not.toContain('bg-indigo-600');
    expect(combinedClasses).not.toContain('h-10');
  });
});