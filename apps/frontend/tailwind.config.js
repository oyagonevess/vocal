/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vocalis: {
          bg: '#0f1117',
          sidebar: '#161922',
          card: '#1e2230',
          hover: '#282d3f',
          accent: '#6366f1',
          neon: '#a855f7',
          active: '#22c55e',
          danger: '#ef4444',
        },
      },
      boxShadow: {
        neon: '0 0 15px rgba(168, 85, 247, 0.5)',
        speaker: '0 0 0 3px #a855f7',
      },
    },
  },
  plugins: [],
};

