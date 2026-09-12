/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        slate: {
          925: '#0b0d14',
          950: '#07080c',
        },
        zinc: {
          850: '#1b1b22',
          900: '#13141a',
          925: '#0f1016',
          950: '#090a0f',
        }
      },
      boxShadow: {
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.25)',
        'glow-indigo': '0 0 24px -4px rgba(99, 102, 241, 0.25)',
        'glow-sky': '0 0 24px -4px rgba(14, 165, 233, 0.25)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.25)',
        'bento': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}

