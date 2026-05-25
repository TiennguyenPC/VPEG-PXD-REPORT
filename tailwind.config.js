/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#060a13",          // Overall background - deep obsidian/dark navy
          panel: "#0b0f19",       // Card and panel background
          sidebar: "#070b14",     // Sidebar dark background
          border: "#182135",      // Subtle card/table border
          borderLight: "#263554", // Hover border/highlight
          textMuted: "#6b7d9b",   // Subtitles, table header text
          purple: "#5252ff",      // Primary purple button, logo glow, active tab
          purpleBg: "rgba(82, 82, 255, 0.15)", // Translucent purple
          blue: "#3b82f6",        // Capacity blue
          blueBg: "rgba(59, 130, 246, 0.15)",
          orange: "#f97316",      // In construction orange
          orangeBg: "rgba(249, 115, 22, 0.15)",
          green: "#10b981",       // Completed green
          greenBg: "rgba(16, 185, 129, 0.15)",
          yellow: "#eab308",      // Medium warning yellow
          red: "#ef4444",         // Danger/high risk red
          redBg: "rgba(239, 68, 68, 0.15)",
        }
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'xxs': '0.65rem',
      }
    },
  },
  plugins: [],
}
