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
          green: 'var(--brand-green)',
          'green-light': 'var(--brand-green-light)',
          silver: 'var(--brand-silver)',
          charcoal: 'var(--brand-charcoal)',
          dark: '#07070a'
        },
        fuji: {
          bg: '#07070a',
          surface: '#0d1017',
          card: 'rgba(17, 21, 30, 0.75)',
          border: 'rgba(255, 255, 255, 0.12)'
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
