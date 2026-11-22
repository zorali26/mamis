/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0b0f19",
        panel: "#131a2b",
        card: "#1a2236",
        accent: "#22d3ee",
        up: "#22c55e",
        down: "#ef4444",
        gold: "#f59e0b",
      },
      boxShadow: {
        glow: "0 0 24px rgba(34,211,238,0.25)",
      },
    },
  },
  plugins: [],
};
