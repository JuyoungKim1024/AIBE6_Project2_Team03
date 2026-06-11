/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './store/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#0A0B0F',
        surface: '#14161D',
        'surface-elevated': '#1C1F28',
        border: '#2A2E39',
        primary: '#3B82F6',
        accent: '#FF6B6B',
        text: {
          primary: '#F4F5F7',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        rank: {
          bronze: '#CD7F32',
          silver: '#C0C0C0',
          gold: '#FBBF24',
          platinum: '#60A5FA',
          diamond: '#06B6D4',
        },
      },
      animation: {
        ticker: 'ticker 30s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
