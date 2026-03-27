/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fafa',
          100: '#ccf2f2',
          200: '#99e5e5',
          300: '#66d2d2',
          400: '#33bfbf',
          500: '#0d9488',
          600: '#0d7377',
          700: '#0b5e62',
          800: '#094a4d',
          900: '#073639',
        }
      }
    },
  },
  plugins: [],
}
