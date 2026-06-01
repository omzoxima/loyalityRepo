/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bisleri: { DEFAULT: "#0057A8", deep: "#003a72", light: "#1E88E5", cyan: "#19C3E6", soft: "#E6F7FC" },
        tier: { silver: "#90A4AE", gold: "#E0A100", platinum: "#7C4DFF" }
      },
      fontFamily: { display: ["var(--font-display)"], sans: ["var(--font-sans)"] }
    }
  },
  plugins: []
};
