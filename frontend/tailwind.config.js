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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8fe9',
          600: '#0171c8',
          700: '#025aa2',
          800: '#064c86',
          900: '#0b406f',
          950: '#07294a',
        },
        designer: {
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        dba: {
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        }
      }
    },
  },
  plugins: [],
}
