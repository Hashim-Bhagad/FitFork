/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#9cab84", // accent (sage)
          foreground: "#f6f0d7",
        },
        secondary: {
          DEFAULT: "#1a1e17", // bg2
          foreground: "#f6f0d7",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#a5ad96", // cream-muted
          foreground: "#f6f0d7",
        },
        accent: {
          DEFAULT: "#c5d89d", // accent-light
          foreground: "#11140f",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "#22281e", // surface
          foreground: "#f6f0d7",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        serif: ["Cormorant Garant", "serif"],
        sans: ["Outfit", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
