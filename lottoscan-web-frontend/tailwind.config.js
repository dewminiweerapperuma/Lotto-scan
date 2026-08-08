/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#E8A800",
          light: "#FFF3CC",
          dark: "#C48F00",
          border: "#FCD34D",
        },
        win: {
          DEFAULT: "#16A34A",
          light: "#DCFCE7",
        },
        lose: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
        },
        brand: {
          bg: "#FAFAF8",
          section: "#F5F3EF",
          card: "#FFFFFF",
          "card-hover": "#FFFDF7",
        },
        text: {
          primary: "#1A1A1A",
          secondary: "#4B5563",
          muted: "#9CA3AF",
          faint: "#D1D5DB",
        },
        border: {
          default: "#E5E7EB",
          hover: "#D1D5DB",
        },
        // Preserve legacy aliases for minor compatibility where needed
        dark: "#1A1A1A",
        panel: "#FFFFFF",
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "float": "float 4s ease-in-out infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGold: {
          "0%,100%": { boxShadow: "0 0 20px rgba(245,197,24,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(245,197,24,0.6)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F5C518, #F0A500)",
        "dark-gradient": "linear-gradient(180deg, #0A0A0F 0%, #12121A 100%)",
      },
    },
  },
  plugins: [],
};
