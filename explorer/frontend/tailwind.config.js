/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0c1322',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        sky: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        cyan: {
          400: '#22d3ee',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      }
    },
  },
  plugins: [],
}
