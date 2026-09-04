import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Royal Fragrance brand palette — multiple shades of brown
        espresso: "#1E120C", // Primary dark background
        chocolate: "#2B1B14", // Secondary dark brown
        rich: "#4A2C20", // Rich brown
        leather: "#70452F", // Warm leather brown
        caramel: "#A66A43", // Accent brown
        sand: "#C49A7A", // Light brown / soft neutral
        cream: "#E8D7C5", // Cream / sand
        brand: {
          50: "#F8F2EB",
          100: "#E8D7C5",
          200: "#C49A7A",
          300: "#A66A43",
          400: "#70452F",
          500: "#4A2C20",
          600: "#2B1B14",
          700: "#1E120C",
          900: "#120B07",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #1E120C 0%, #4A2C20 50%, #70452F 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, #E8D7C5 0%, #C49A7A 100%)",
      },
      boxShadow: {
        premium: "0 20px 60px -15px rgba(30, 18, 12, 0.45)",
        "premium-sm": "0 10px 30px -10px rgba(30, 18, 12, 0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease-out forwards",
        "fade-in": "fadeIn 1s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
