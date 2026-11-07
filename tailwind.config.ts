import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f7f5f0",
        foreground: "#0b1f3a",
        cream: "#f7f5f0",
        paper: "#ffffff",
        navy: {
          DEFAULT: "#0b1f3a",
          light: "#16325a",
          muted: "#3a516e",
        },
        gold: {
          DEFAULT: "#c9a227",
          muted: "#dbb84a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "gold-line": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "gold-line": "gold-line 0.8s ease-out 0.2s both",
      },
    },
  },
  plugins: [animate],
};

export default config;
