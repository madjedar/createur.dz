/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Inter', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        obsidian: {
          DEFAULT: '#080C14',
          dark: '#030509',
          card: '#0C121E',
        },
        mint: {
          DEFAULT: '#10B981',
          bright: '#34D399',
          glow: 'rgba(16, 185, 129, 0.25)',
        },
        sand: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        brand: {
          emerald: '#10b981',
          blue: '#2563eb',
          gold: '#F59E0B',
          cib: '#003DA5',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #10B981, #34D399)',
        'gradient-mint': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        'gradient-gold': 'linear-gradient(135deg, #F59E0B, #FBBF24)',
        'gradient-dark': 'linear-gradient(180deg, #080C14 0%, #030509 100%)',
        'gradient-mesh': 'radial-gradient(at 10% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 60%), radial-gradient(at 90% 80%, rgba(52, 211, 153, 0.08) 0%, transparent 60%), radial-gradient(at 50% 50%, rgba(245, 158, 11, 0.04) 0%, transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
