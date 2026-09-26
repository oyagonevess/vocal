/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vocalis: {
          bg: '#050506',
          sidebar: '#0d0d0f',
          card: '#141417',
          hover: '#1f1f23',
          accent: '#6366f1',
          neon: '#a855f7',
          active: '#22c55e',
          danger: '#ef4444',
        },
      },
      boxShadow: {
        neon: '0 0 15px rgba(99, 102, 241, 0.4)',
        speaker: '0 0 0 3px #a855f7',
      },
    },
  },
  plugins: [],
};

