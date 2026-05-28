import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#0a0a0a',
        pink: {
          DEFAULT: '#D4186C',
          neon: '#D4186C',
          hot: '#E8005A',
          dark: '#A0104F',
          glow: '#D4186C',
          muted: '#E879A0',
          bright: '#D4186C',
        },
        magenta: '#FF00FF',
        gray: {
          900: '#111111',
          800: '#1a1a1a',
          700: '#2a2a2a',
          600: '#3a3a3a',
          500: '#666666',
          400: '#999999',
          300: '#cccccc',
        },
      },
      fontFamily: {
        title: ['var(--font-bebas)', 'Impact', 'Arial Black', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'neon-pink': '0 0 20px #D4186C, 0 0 40px #D4186C44',
        'neon-pink-lg': '0 0 40px #D4186C, 0 0 80px #D4186C44, 0 0 120px #D4186C22',
        'neon-pink-sm': '0 0 10px #D4186C88',
        'inner-pink': 'inset 0 0 30px #D4186C22',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-pink-black': 'linear-gradient(135deg, #0a0a0a 0%, #1a0a14 50%, #0a0a0a 100%)',
        'gradient-pink-top': 'linear-gradient(180deg, #D4186C22 0%, transparent 40%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'snake-slither': 'snake-slither 3s ease-in-out infinite',
        'reveal': 'reveal 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slide-down 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px #D4186C44, 0 0 40px #D4186C22' },
          '50%': { boxShadow: '0 0 40px #D4186C, 0 0 80px #D4186C66, 0 0 120px #D4186C33' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'reveal': {
          from: { opacity: '0', transform: 'scale(0.5) translateY(50px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'snake-slither': {
          '0%, 100%': { transform: 'rotate(-2deg) scaleX(1)' },
          '50%': { transform: 'rotate(2deg) scaleX(1.02)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
