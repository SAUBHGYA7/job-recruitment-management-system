/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        steel: {
          950: '#0d1117',
          900: '#151b23',
          850: '#1a222d',
          800: '#212836',
          700: '#2f394a',
          600: '#46556d',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
        },
        copper: {
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
        },
        oracle: {
          red: '#c7382c',
          crimson: '#e03e2d',
        },
        accent: {
          cyan: '#0ea5e9',
          amber: '#f59e0b',
          emerald: '#10b981',
          indigo: '#6366f1'
        }
      }
    },
  },
  plugins: [],
}
