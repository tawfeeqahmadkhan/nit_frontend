/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:        '#F5F4F1',
        surface:   '#FFFFFF',
        rail:      '#1A2E1A',          // SolveNet dark green rail
        accent:    '#F97316',          // SolveNet orange
        'accent-hover': '#EA580C',
        'accent-light': '#FFF7ED',     // orange-50
        'accent-green': '#166534',     // SolveNet dark green accent
        'card-dark': '#0F1F0F',        // dark green-tinted card
        border:    '#E8E7E4',
        'text-primary':   '#0F0F0F',
        'text-secondary': '#6B7280',
        'text-muted':     '#9CA3AF',
        success:   '#22C55E',
        warning:   '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px 0 rgba(0,0,0,0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        'fade-up': 'fadeUp 0.5s ease-out both',
      },
    }
  },
  plugins: []
}
