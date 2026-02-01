/** @type {import('tailwindcss').Config} */
import radix from "tailwindcss-radix";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{jsx,tsx,ts,js}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      boxShadow: {
        "elevation-card-rest": "0px 0px 0px 1px rgba(0, 0, 0, 0.08), 0px 1px 2px -1px rgba(0, 0, 0, 0.08), 0px 2px 4px 0px rgba(0, 0, 0, 0.04)",
        "elevation-card-rest-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px #27272A, 0px 1px 2px 0px rgba(0, 0, 0, 0.32), 0px 2px 4px 0px rgba(0, 0, 0, 0.32)",
        "elevation-card-hover": "0px 0px 0px 1px rgba(0, 0, 0, 0.08), 0px 1px 2px -1px rgba(0, 0, 0, 0.08), 0px 2px 8px 0px rgba(0, 0, 0, 0.10)",
        "elevation-card-hover-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px #27272A, 0px 1px 4px 0px rgba(0, 0, 0, 0.48), 0px 2px 8px 0px rgba(0, 0, 0, 0.48)",
        "elevation-tooltip": "0px 0px 0px 1px rgba(0, 0, 0, 0.08), 0px 2px 4px 0px rgba(0, 0, 0, 0.08), 0px 4px 8px 0px rgba(0, 0, 0, 0.08)",
        "elevation-tooltip-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.04), 0px 0px 0px 1px rgba(255, 255, 255, 0.10), 0px 2px 4px 0px rgba(0, 0, 0, 0.32), 0px 4px 8px 0px rgba(0, 0, 0, 0.32)",
        "elevation-flyout": "0px 0px 0px 1px rgba(0, 0, 0, 0.08), 0px 4px 8px 0px rgba(0, 0, 0, 0.08), 0px 8px 16px 0px rgba(0, 0, 0, 0.08)",
        "elevation-flyout-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.04), 0px 0px 0px 1px rgba(255, 255, 255, 0.10), 0px 4px 8px 0px rgba(0, 0, 0, 0.32), 0px 8px 16px 0px rgba(0, 0, 0, 0.32)",
        "elevation-modal": "0px 0px 0px 1px #FFF inset, 0px 0px 0px 1.5px rgba(228, 228, 231, 0.60) inset, 0px 0px 0px 1px rgba(0, 0, 0, 0.08), 0px 8px 16px 0px rgba(0, 0, 0, 0.08), 0px 16px 32px 0px rgba(0, 0, 0, 0.08)",
        "elevation-modal-dark": "0px 0px 0px 1px #18181B inset, 0px 0px 0px 1.5px rgba(255, 255, 255, 0.06) inset, 0px -1px 0px 0px rgba(255, 255, 255, 0.04), 0px 0px 0px 1px rgba(255, 255, 255, 0.10), 0px 4px 8px 0px rgba(0, 0, 0, 0.32), 0px 8px 16px 0px rgba(0, 0, 0, 0.32)",
        "button-neutral": "0px 1px 2px 0px rgba(0, 0, 0, 0.12), 0px 0px 0px 1px rgba(0, 0, 0, 0.08)",
        "button-neutral-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px rgba(39, 39, 42, 1), 0px 0px 1px 1.5px rgba(0, 0, 0, 0.24), 0px 2px 2px 0px rgba(0, 0, 0, 0.24)",
        "button-neutral-focused": "0px 1px 2px 0px rgba(0, 0, 0, 0.12), 0px 0px 0px 1px rgba(0, 0, 0, 0.08), 0px 0px 0px 2px rgba(255, 255, 255, 1), 0px 0px 0px 4px rgba(59, 130, 246, 0.6)",
        "button-neutral-focused-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px rgba(39, 39, 42, 1), 0px 0px 0px 2px rgba(24, 24, 27, 1), 0px 0px 0px 4px rgba(96, 165, 250, 0.8)",
        "button-danger": "0px 0.75px 0px 0px rgba(255, 255, 255, 0.2) inset, 0px 1px 2px 0px rgba(190, 18, 60, 0.4), 0px 0px 0px 1px rgba(190, 18, 60, 1)",
        "button-danger-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.16), 0px 0px 0px 1px rgba(255, 255, 255, 0.12), 0px 0px 0px 1px rgba(159, 18, 57, 1), 0px 0px 1px 1.5px rgba(0, 0, 0, 0.24), 0px 2px 2px 0px rgba(0, 0, 0, 0.24)",
        "button-danger-focused": "0px 0.75px 0px 0px rgba(255, 255, 255, 0.2) inset, 0px 1px 2px 0px rgba(190, 18, 60, 0.4), 0px 0px 0px 1px rgba(190, 18, 60, 1), 0px 0px 0px 2px rgba(255, 255, 255, 1), 0px 0px 0px 4px rgba(59, 130, 246, 0.6)",
        "button-danger-focused-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.16), 0px 0px 0px 1px rgba(255, 255, 255, 0.12), 0px 0px 0px 1px rgba(159, 18, 57, 1), 0px 0px 0px 2px rgba(24, 24, 27, 1), 0px 0px 0px 4px rgba(96, 165, 250, 0.8)",
        "button-inverted": "0px 0.75px 0px 0px rgba(255, 255, 255, 0.2) inset, 0px 1px 2px 0px rgba(0, 0, 0, 0.4), 0px 0px 0px 1px rgba(24, 24, 27, 1)",
        "button-inverted-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.12), 0px 0px 0px 1px rgba(255, 255, 255, 0.1), 0px 0px 0px 1px rgba(82, 82, 91, 1), 0px 0px 1px 1.5px rgba(0, 0, 0, 0.24), 0px 2px 2px 0px rgba(0, 0, 0, 0.24)",
        "button-inverted-focused": "0px 0.75px 0px 0px rgba(255, 255, 255, 0.2) inset, 0px 1px 2px 0px rgba(0, 0, 0, 0.4), 0px 0px 0px 1px rgba(24, 24, 27, 1), 0px 0px 0px 2px rgba(255, 255, 255, 1), 0px 0px 0px 4px rgba(59, 130, 246, 0.6)",
        "button-inverted-focused-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.12), 0px 0px 0px 1px rgba(255, 255, 255, 0.12), 0px 0px 0px 1px rgba(82, 82, 91, 1), 0px 0px 0px 2px rgba(24, 24, 27, 1), 0px 0px 0px 4px rgba(96, 165, 250, 0.8)",
        "elevation-code-block": "0px 0px 0px 1px #18181B inset, 0px 0px 0px 1.5px rgba(255, 255, 255, 0.20) inset",
        "elevation-code-block-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px #27272A, 0px 1px 2px 0px rgba(0, 0, 0, 0.32), 0px 2px 4px 0px rgba(0, 0, 0, 0.32)",
        active: "0px 0px 0px 3px #E1F0FF",
        "active-dark": "0px 0px 0px 3px #2C2250",
        "border-base": "0px 1px 2px 0px rgba(0, 0, 0, 0.12), 0px 0px 0px 1px rgba(0, 0, 0, 0.08)",
        "border-base-dark": "0px -1px 0px 0px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px rgba(255, 255, 255, 0.06), 0px 0px 0px 1px rgba(39, 39, 42, 1), 0px 0px 1px 1.5px rgba(0, 0, 0, 0.24), 0px 2px 2px 0px rgba(0, 0, 0, 0.24)",
        'inner-glow': 'inset 0 0 15px rgba(255, 255, 255, 0.3)',
      },
      backgroundImage: {
        "code-fade-top-to-bottom": "`linear-gradient(180deg, #27272A 0%, rgba(39, 39, 42, 0.00) 100%)`",
        "code-fade-bottom-to-top": "`linear-gradient(180deg, rgba(39, 39, 42, 0.00) 0%, #27272A 100%)`",
        "base-code-fade-right-to-left": "`linear-gradient(90deg, #18181b7d, #18181B)`",
        "subtle-code-fade-right-to-left": "`linear-gradient(90deg, #27272aa3, #27272A)`",
        "code-fade-top-to-bottom-dark": "`linear-gradient(180deg, #2F2F32 0%, rgba(47, 47, 50, 0.00) 100%)`",
        "code-fade-bottom-to-top-dark": "`linear-gradient(180deg, rgba(47, 47, 50, 0.00) 0%, #2F2F32 100%)`",
        "base-code-fade-right-to-left-dark": "`linear-gradient(90deg, #27272aa3, #27272A)`",
        "subtle-code-fade-right-to-left-dark": "`linear-gradient(90deg, #30303380, #303033)`",
        "border-dotted": "linear-gradient(90deg,var(--docs-border-strong) 1px,transparent 1px)",
        "ai-assistant-bottom": "linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, var(--docs-bg-base) 100%)",
      },
      transitionTimingFunction: {
        ease: "ease",
      },
      width: {
        "sidebar-xs": "calc(100% - 20px)",
      },
      keyframes: {
        fadeIn: {
          from: {
            opacity: 0,
          },
          to: {
            opacity: 1,
          },
        },
        fadeOut: {
          from: {
            opacity: 1,
          },
          to: {
            opacity: 0,
          },
        },
        tada: {
          from: {
            transform: "scale3d(1, 1, 1)",
          },
          "10%, 20%": {
            transform: "scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg)",
          },
          "30%, 50%, 70%, 90%": {
            transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)",
          },
          "40%, 60%, 80%": {
            transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)",
          },
          to: {
            transform: "scale3d(1, 1, 1)",
          },
        },
        fadeInDown: {
          from: {
            opacity: "0",
            transform: "translate3d(0, -100%, 0)",
          },
          to: {
            opacity: "1",
            transform: "translate3d(0, 0, 0)",
          },
        },
        fadeInLeft: {
          from: {
            opacity: "0",
            transform: "translate3d(-100%, 0, 0)",
          },
          to: {
            opacity: "1",
            transform: "translate3d(0, 0, 0)",
          },
        },
        fadeInRight: {
          from: {
            opacity: "0",
            transform: "translate3d(100%, 0, 0)",
          },
          to: {
            opacity: "1",
            transform: "translate3d(0, 0, 0)",
          },
        },
        fadeOutUp: {
          from: {
            opacity: "1",
          },
          to: {
            opacity: "0",
            transform: "translate3d(0, -100%, 0)",
          },
        },
        fadeOutLeft: {
          from: {
            opacity: "1",
          },
          to: {
            opacity: "0",
            transform: "translate3d(-100%, 0, 0)",
          },
        },
        fadeOutRight: {
          from: {
            opacity: "1",
          },
          to: {
            opacity: "0",
            transform: "translate3d(100%, 0, 0)",
          },
        },
        slideInRight: {
          from: {
            transform: "translate3d(100%, 0, 0)",
            visibility: "visible",
          },
          to: {
            transform: "translate3d(0, 0, 0)",
          },
        },
        slideOutRight: {
          from: {
            transform: "translate3d(0, 0, 0)",
          },
          to: {
            visibility: "hidden",
            transform: "translate3d(100%, 0, 0)",
          },
        },
        slideInLeft: {
          from: {
            transform: "translate3d(-100%, 0, 0)",
            visibility: "visible",
          },
          to: {
            transform: "translate3d(0, 0, 0)",
          },
        },
        slideOutLeft: {
          from: {
            transform: "translate3d(0, 0, 0)",
          },
          to: {
            visibility: "hidden",
            transform: "translate3d(-100%, 0, 0)",
          },
        },
        pulsingDots: {
          "0%": {
            opacity: 1,
          },
          "100%": {
            opacity: 0.3,
          },
        },
        minimize: {
          from: {
            transform: "scale(1)",
          },
          to: {
            transform: "scale(0)",
          },
        },
        maximize: {
          from: {
            transform: "scale(0)",
          },
          to: {
            transform: "scale(1)",
          },
        },
        flash: {
          "0%": {
            backgroundColor: "transparent",
          },
          "50%": {
            backgroundColor: "var(--animation-color)",
          },
          "100%": {
            backgroundColor: "transparent",
          },
        },
        slideInDown: {
          from: {
            transform: "translate3d(0, -100%, 0)",
            visibility: "visible",
          },
          to: {
            transform: "translate3d(0, 0, 0)",
          },
        },
        slideOutUp: {
          from: {
            transform: "translate3d(0, 0, 0)",
          },
          to: {
            transform: "translate3d(0, -100%, 0)",
            visibility: "hidden",
          },
        },
        growWidth: {
          from: {
            width: 0,
          },
          to: {
            width: "100%",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "move-stripes": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "60px 30px" }, // Matches backgroundSize in component
        },
      },
      animation: {
        fadeIn: "fadeIn 500ms",
        fadeOut: "fadeOut 500ms",
        fadeInDown: "fadeInDown 500ms",
        fadeInLeft: "fadeInLeft 500ms",
        fadeInRight: "fadeInRight 500ms",
        fadeOutUp: "fadeOutUp 500ms",
        fadeOutLeft: "fadeOutLeft 500ms",
        fadeOutRight: "fadeOutRight 500ms",
        tada: "tada 1s",
        slideInRight: "slideInRight 500ms",
        slideOutRight: "slideOutRight 150ms",
        slideOutUp: "slideOutUp 500ms",
        slideInLeft: "slideInLeft 500ms",
        slideOutLeft: "slideOutLeft 500ms",
        slideInDown: "slideInDown 150ms",
        pulsingDots: "pulsingDots 1s alternate infinite",
        minimize: "minimize 500ms",
        maximize: "maximize 500ms",
        flash: "flash 1500ms 1",
        growWidth: "growWidth 500ms",
        shimmer: "shimmer 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 3s infinite",
        "move-stripes": "move-stripes 3s linear infinite",
        "shimmer-fast": "shimmer 1s cubic-bezier(0.4, 0, 0.6, 1) forwards",
      },
      scrollMargin: {
        56: "56px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [radix(), animate],
};
