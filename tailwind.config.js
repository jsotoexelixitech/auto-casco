/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      xs: '380px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // ────────────────────────────────────────────────────────────────
        // La Mundial de Seguros — Manual de Identidad oficial
        // Color Principal · Azul Pennsylvania · #0F1A5A
        // Color Secundario · Rojo Imperial · #E84F51
        // Color Terciario · Plata · #ACACAC
        // ────────────────────────────────────────────────────────────────
        brand: {
          DEFAULT: '#0F1A5A',
          50: '#eef0fa',
          100: '#dde1f4',
          200: '#bbc3e9',
          300: '#909bd7',
          400: '#6371c2',
          500: '#3a48a4',
          600: '#162a7f', // accent shade (lighter primary)
          700: '#0F1A5A', // PRIMARY · Azul Pennsylvania
          800: '#091133', // dark accent
          900: '#050924',
        },
        accent: {
          DEFAULT: '#E84F51', // Rojo Imperial
          50: '#fff0f0',
          100: '#ffdedf',
          200: '#ffbcbe',
          300: '#ff8c8e',
          400: '#ff6675', // light shade
          500: '#E84F51', // BRAND red
          600: '#cc3a3d',
          700: '#b23f44', // dark shade
          800: '#8b2f33',
          900: '#5e1f23',
        },
        silver: {
          DEFAULT: '#ACACAC',
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#dddddd', // light shade
          300: '#cccccc',
          400: '#ACACAC', // BRAND silver
          500: '#888888',
          600: '#777777', // dark shade
          700: '#555555',
          800: '#3a3a3a',
          900: '#1f1f1f',
        },

        // ── Aliases used widely across the app (mapped to brand) ──
        primary: '#0F1A5A',
        'on-primary': '#ffffff',
        'primary-container': '#162A7F',
        'on-primary-container': '#dde1f4',
        'primary-fixed': '#dde1f4',
        'primary-fixed-dim': '#bbc3e9',
        'on-primary-fixed': '#091133',
        'on-primary-fixed-variant': '#162A7F',
        'inverse-primary': '#bbc3e9',

        secondary: '#b23f44',
        'on-secondary': '#ffffff',
        'secondary-container': '#E84F51',
        'on-secondary-container': '#ffffff',
        'secondary-fixed': '#ffdedf',
        'secondary-fixed-dim': '#ff8c8e',
        'on-secondary-fixed': '#5e1f23',
        'on-secondary-fixed-variant': '#8b2f33',

        tertiary: '#091133',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#162A7F',
        'on-tertiary-container': '#bbc3e9',

        error: '#dc2626',
        'on-error': '#ffffff',
        'error-container': '#fee2e2',
        'on-error-container': '#7f1d1d',

        success: '#16a34a',
        'on-success': '#ffffff',
        'success-container': '#dcfce7',
        'on-success-container': '#14532d',

        warning: '#d97706',
        'on-warning': '#ffffff',
        'warning-container': '#fef3c7',
        'on-warning-container': '#78350f',

        background: '#f7f8fc',
        'on-background': '#0c1226',

        surface: '#f7f8fc',
        'on-surface': '#0c1226',
        'on-surface-variant': '#4a4f63',
        'surface-variant': '#e7e9f2',
        'surface-dim': '#dadce6',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f1f3f9',
        'surface-container': '#e9ecf3',
        'surface-container-high': '#dee1ec',
        'surface-container-highest': '#d5d8e3',
        'inverse-surface': '#1a1f33',
        'inverse-on-surface': '#eef0fa',

        outline: '#7a7f95',
        'outline-variant': '#c8ccdb',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Constantia', 'Georgia', 'serif'],
        wordmark: ['"Playfair Display"', 'Constantia', 'Georgia', 'serif'],
      },
      // Fluid typography using clamp for perfect responsive sizing
      fontSize: {
        // tokens — fluid (min, vw, max)
        'display-2xl': ['clamp(2.25rem, 5.5vw + 1rem, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['clamp(1.75rem, 3.5vw + 1rem, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['clamp(1.5rem, 1.8vw + 1rem, 2rem)', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['clamp(1.125rem, 0.7vw + 1rem, 1.5rem)', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['clamp(1rem, 0.2vw + 0.95rem, 1.125rem)', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['1rem', { lineHeight: '1.55', fontWeight: '400' }],
        'label-md': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '600' }],
        caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        // raw scale (still useful for explicit pixel sizes)
        '2xs': ['0.6875rem', { lineHeight: '1.3' }],
      },
      spacing: {
        base: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        gutter: 'clamp(16px, 2.5vw, 28px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.75rem',
        full: '9999px',
      },
      boxShadow: {
        'elev-1': '0 4px 18px rgba(15, 26, 90, 0.06)',
        'elev-2': '0 10px 30px rgba(15, 26, 90, 0.10)',
        'elev-primary': '0 8px 24px rgba(15, 26, 90, 0.30)',
        'elev-accent': '0 8px 24px rgba(232, 79, 81, 0.32)',
        'inner-soft': 'inset 0 1px 2px rgba(15, 26, 90, 0.04)',
      },
      maxWidth: {
        container: '1280px',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { '0%': { opacity: '0', transform: 'translateX(-12px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #162A7F 0%, #0F1A5A 50%, #091133 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, #162A7F 0%, #0F1A5A 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FF6675 0%, #E84F51 50%, #B23F44 100%)',
        'gradient-sunrise': 'linear-gradient(135deg, #FF6675 0%, #E84F51 35%, #162A7F 75%, #091133 100%)',
        'gradient-mesh':
          'radial-gradient(at 0% 0%, #162A7F 0%, transparent 50%), radial-gradient(at 100% 0%, #E84F51 0%, transparent 40%), radial-gradient(at 100% 100%, #0F1A5A 0%, transparent 60%), radial-gradient(at 0% 100%, #091133 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
}
