/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B00',
          dark: '#E66000',
          light: '#FFE8D0'
        },
        secondary: {
          DEFAULT: '#64748b',
          light: '#F1F5F9'
        },
        accent: {
          DEFAULT: '#0F172A',
          light: '#F8F9FA'
        }
      },
    },
  },
  plugins: [],
};
