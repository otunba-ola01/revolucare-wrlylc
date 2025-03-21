import type { Config } from "tailwindcss";
import { defaultTheme } from "tailwindcss";
import plugin from "tailwindcss/plugin";

import {
  themeConfig,
  lightTheme,
  darkTheme,
  responsiveBreakpoints
} from "./config/theme";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        xs: "375px", // Mobile Small
        sm: "640px", // Mobile
        md: "768px", // Tablet
        lg: "1024px", // Desktop
        xl: "1280px", // Large Desktop
        "2xl": "1536px", // Extra Large
      },
    },
    extend: {
      colors: {
        primary: {
          50: "hsl(var(--primary) / 0.05)",
          100: "hsl(var(--primary) / 0.1)",
          200: "hsl(var(--primary) / 0.2)",
          300: "hsl(var(--primary) / 0.3)",
          400: "hsl(var(--primary) / 0.4)",
          500: "hsl(var(--primary) / 0.5)",
          600: "hsl(var(--primary) / 0.6)",
          700: "hsl(var(--primary) / 0.7)",
          800: "hsl(var(--primary) / 0.8)",
          900: "hsl(var(--primary) / 0.9)",
          950: "hsl(var(--primary) / 0.95)",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          50: "hsl(var(--secondary) / 0.05)",
          100: "hsl(var(--secondary) / 0.1)",
          200: "hsl(var(--secondary) / 0.2)",
          300: "hsl(var(--secondary) / 0.3)",
          400: "hsl(var(--secondary) / 0.4)",
          500: "hsl(var(--secondary) / 0.5)",
          600: "hsl(var(--secondary) / 0.6)",
          700: "hsl(var(--secondary) / 0.7)",
          800: "hsl(var(--secondary) / 0.8)",
          900: "hsl(var(--secondary) / 0.9)",
          950: "hsl(var(--secondary) / 0.95)",
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          50: "hsl(var(--accent) / 0.05)",
          100: "hsl(var(--accent) / 0.1)",
          200: "hsl(var(--accent) / 0.2)",
          300: "hsl(var(--accent) / 0.3)",
          400: "hsl(var(--accent) / 0.4)",
          500: "hsl(var(--accent) / 0.5)",
          600: "hsl(var(--accent) / 0.6)",
          700: "hsl(var(--accent) / 0.7)",
          800: "hsl(var(--accent) / 0.8)",
          900: "hsl(var(--accent) / 0.9)",
          950: "hsl(var(--accent) / 0.95)",
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          50: "hsl(var(--success) / 0.05)",
          100: "hsl(var(--success) / 0.1)",
          200: "hsl(var(--success) / 0.2)",
          300: "hsl(var(--success) / 0.3)",
          400: "hsl(var(--success) / 0.4)",
          500: "hsl(var(--success) / 0.5)",
          600: "hsl(var(--success) / 0.6)",
          700: "hsl(var(--success) / 0.7)",
          800: "hsl(var(--success) / 0.8)",
          900: "hsl(var(--success) / 0.9)",
          950: "hsl(var(--success) / 0.95)",
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          50: "hsl(var(--warning) / 0.05)",
          100: "hsl(var(--warning) / 0.1)",
          200: "hsl(var(--warning) / 0.2)",
          300: "hsl(var(--warning) / 0.3)",
          400: "hsl(var(--warning) / 0.4)",
          500: "hsl(var(--warning) / 0.5)",
          600: "hsl(var(--warning) / 0.6)",
          700: "hsl(var(--warning) / 0.7)",
          800: "hsl(var(--warning) / 0.8)",
          900: "hsl(var(--warning) / 0.9)",
          950: "hsl(var(--warning) / 0.95)",
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        error: {
          50: "hsl(var(--error) / 0.05)",
          100: "hsl(var(--error) / 0.1)",
          200: "hsl(var(--error) / 0.2)",
          300: "hsl(var(--error) / 0.3)",
          400: "hsl(var(--error) / 0.4)",
          500: "hsl(var(--error) / 0.5)",
          600: "hsl(var(--error) / 0.6)",
          700: "hsl(var(--error) / 0.7)",
          800: "hsl(var(--error) / 0.8)",
          900: "hsl(var(--error) / 0.9)",
          950: "hsl(var(--error) / 0.95)",
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "slide-in-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-out-bottom": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-out",
        "slide-out-bottom": "slide-out-bottom 0.3s ease-out",
      },
      screens: {
        xs: "375px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("tailwindcss-animate"),
    plugin(function({ addUtilities }) {
      addUtilities({
        ".text-balance": {
          "text-wrap": "balance",
        },
        ".text-pretty": {
          "text-wrap": "pretty",
        },
        ".truncate-2": {
          "display": "-webkit-box",
          "-webkit-line-clamp": "2",
          "-webkit-box-orient": "vertical",
          "overflow": "hidden",
        },
        ".truncate-3": {
          "display": "-webkit-box",
          "-webkit-line-clamp": "3",
          "-webkit-box-orient": "vertical",
          "overflow": "hidden",
        },
      });
    }),
  ],
};

export default config;