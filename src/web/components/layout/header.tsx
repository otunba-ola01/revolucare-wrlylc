import React, { useState, useEffect } from 'react'; // react ^18.2.0
import Link from 'next/link'; // next/link ^14.0.0
import Image from 'next/image'; // next/image ^14.0.0
import { usePathname } from 'next/navigation'; // next/navigation ^14.0.0
import { Menu, X, Sun, Moon, LaptopIcon } from 'lucide-react'; // lucide-react ^0.284.0

import { Navigation } from './navigation';
import { MobileNav } from './mobile-nav';
import { NotificationBell } from '../common/notification-bell';
import { UserMenu } from '../common/user-menu';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/use-auth';
import { useTheme } from '../../lib/state/theme-provider';
import { logoConfig } from '../../config/site';
import { cn } from '../../lib/utils/color';

/**
 * Main header component that provides navigation, authentication controls, and theme switching
 */
export const Header: React.FC = () => {
  // LD1: Get authentication state using useAuth hook
  const { isAuthenticated } = useAuth();

  // LD1: Get theme state and functions using useTheme hook
  const { theme, setTheme } = useTheme();

  // LD1: Get current pathname using usePathname hook
  const pathname = usePathname();

  // LD1: Set up state for mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // LD1: Create function to toggle mobile menu visibility
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // LD1: Create function to toggle between light, dark, and system themes
  const toggleTheme = () => {
    // IE1: Get current theme from useTheme hook
    const currentTheme = theme;

    // IE1: Determine next theme in the cycle (light -> dark -> system -> light)
    let nextTheme: typeof theme = 'light';
    if (currentTheme === 'light') {
      nextTheme = 'dark';
    } else if (currentTheme === 'dark') {
      nextTheme = 'system';
    } else {
      nextTheme = 'light';
    }

    // IE1: Call setTheme with the next theme value
    setTheme(nextTheme);
  };

  // LD1: Create function to get the appropriate theme icon based on current theme
  const getThemeIcon = (theme: string): React.ReactNode => {
    switch (theme) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />;
      case 'dark':
        return <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />;
      case 'system':
        return <LaptopIcon className="h-[1.2rem] w-[1.2rem] absolute rotate-[-110deg] scale-0 transition-all dark:rotate-0 dark:scale-100" />;
      default:
        return null;
    }
  };

  // LD1: Render header with logo, navigation, and authentication controls
  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        {/* Logo and Site Name */}
        <Link href="/" className="flex items-center font-semibold">
          <Image
            src={logoConfig.mainLogo} // Use main logo by default
            alt="Revolucare Logo"
            width={120}
            height={30}
            priority
          />
        </Link>

        {/* Main Navigation (Desktop) */}
        <Navigation />

        {/* Authentication Controls and Theme Toggle */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle Button */}
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
            {getThemeIcon(theme)}
          </Button>

          {/* Notification Bell and User Menu (if authenticated) */}
          {isAuthenticated ? (
            <>
              <NotificationBell className="mr-2" />
              <UserMenu />
            </>
          ) : (
            <>
              {/* Login and Register Buttons (if not authenticated) */}
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="sm:hidden"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* LD1: Conditionally render mobile menu based on state */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          {/* Mobile navigation content */}
          {/*  Consider using a separate MobileNavigation component here */}
        </div>
      )}

      {/* LD1: Render MobileNav component for bottom navigation on small screens */}
      <MobileNav />
    </header>
  );
};

/**
 * Returns the appropriate icon component based on the current theme
 * @param theme The current theme ('light', 'dark', or 'system')
 * @returns Icon component to render
 */
const getThemeIcon = (theme: string): React.ReactNode => {
  switch (theme) {
    case 'light':
      return <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />;
    case 'dark':
      return <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />;
    case 'system':
      return <LaptopIcon className="h-[1.2rem] w-[1.2rem] absolute rotate-[-110deg] scale-0 transition-all dark:rotate-0 dark:scale-100" />;
    default:
      return null;
  }
};

/**
 * Cycles through available themes (light, dark, system)
 */
const toggleTheme = () => {
  // IE1: Get current theme from useTheme hook
  const currentTheme = useTheme().theme;

  // IE1: Determine next theme in the cycle (light -> dark -> system -> light)
  let nextTheme: typeof currentTheme = 'light';
  if (currentTheme === 'light') {
    nextTheme = 'dark';
  } else if (currentTheme === 'dark') {
    nextTheme = 'system';
  } else {
    nextTheme = 'light';
  }

  // IE1: Call setTheme with the next theme value
  useTheme().setTheme(nextTheme);
};