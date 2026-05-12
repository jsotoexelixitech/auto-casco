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
          200: '#DDDDDD', // light shade (alineado con Suscripcion-rcv)
          300: '#C5C5C5',
          400: '#ACACAC', // BRAND silver
          500: '#888888',
          600: '#777777', // dark shade
          700: '#5A5A5A',
          800: '#3F3F46',
          900: '#1F1F23',
        },

        // ────────────────────────────────────────────────────────────────
        // Azules medios del isotipo La Mundial (stops del logo "M"):
        //   blue-mid  · #2E6DBF
        //   blue-light· #4A8DD5
        // Estos azules vienen del Manual de Identidad y son los mismos
        // usados en Suscripcion-rcv para los gradientes que reproducen el
        // logo.
        // ────────────────────────────────────────────────────────────────
        blue: {
          50:  '#EAF2FB',
          100: '#CFE0F4',
          200: '#A1C1E9',
          300: '#71A2DC',
          400: '#4A8DD5', // BRAND blue light (logo stop)
          500: '#2E6DBF', // BRAND blue mid (logo stop)
          600: '#1E51A0',
          700: '#163E80',
          800: '#112E60',
          900: '#0C2245',
          950: '#07172E',
        },

        // ── Aliases breves para componer gradientes / utilidades rápidas ──
        'brand-navy':         '#0F1A5A',
        'brand-navy-deep':    '#091133',
        'brand-navy-soft':    '#162A7F',
        'brand-blue-mid':     '#2E6DBF',
        'brand-blue-light':   '#4A8DD5',
        'brand-red':          '#E84F51',
        'brand-red-deep':     '#B23F44',
        'brand-red-light':    '#FF6675',
        'brand-silver':       '#ACACAC',
        'brand-silver-soft':  '#DDDDDD',

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

        // ── Colores semánticos alineados con Suscripcion-rcv ──
        //   success (emerald): --color-emerald-success #10B981
        //   warning (amber)  : --color-amber-warm      #F59E0B
        //   error   (rose)   : --color-rose-error      #F43F5E
        error: '#F43F5E',
        'on-error': '#ffffff',
        'error-container': '#FFE4E6',
        'on-error-container': '#881337',

        success: '#10B981',
        'on-success': '#ffffff',
        'success-container': '#D1FAE5',
        'on-success-container': '#064E3B',

        warning: '#F59E0B',
        'on-warning': '#ffffff',
        'warning-container': '#FEF3C7',
        'on-warning-container': '#78350F',

        // Alineado con Suscripcion-rcv (`--color-page-bg`, `--color-text-primary`)
        background: '#F4F6FB',
        'on-background': '#091133',

        surface: '#F4F6FB',
        'on-surface': '#091133',
        'on-surface-variant': '#5A5A5A',
        'surface-variant': '#e7e9f2',
        'surface-dim': '#dadce6',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f1f3f9',
        'surface-container': '#e9ecf3',
        'surface-container-high': '#dee1ec',
        'surface-container-highest': '#d5d8e3',
        'inverse-surface': '#091133',
        'inverse-on-surface': '#eef0fa',

        outline: '#7a7f95',
        'outline-variant': '#c8ccdb',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        // Tipografía serif oficial La Mundial: Constantia → Source Serif 4
        // (igual que Suscripcion-rcv).
        serif: ['Constantia', '"Source Serif 4"', 'Georgia', 'serif'],
        wordmark: ['Constantia', '"Source Serif 4"', 'Georgia', 'serif'],
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
        // Existentes (no se tocan para no romper estilos ya aplicados)
        'gradient-brand': 'linear-gradient(135deg, #162A7F 0%, #0F1A5A 50%, #091133 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, #162A7F 0%, #0F1A5A 100%)',
        // Rojo Imperial oficial (sin el shade claro coral): #E84F51 → #B23F44
        'gradient-accent': 'linear-gradient(135deg, #E84F51 0%, #B23F44 100%)',
        // Variante "luminosa" para usos puntuales (cards de bienvenida, etc.)
        'gradient-accent-bright': 'linear-gradient(135deg, #FF6675 0%, #E84F51 60%, #B23F44 100%)',
        'gradient-sunrise': 'linear-gradient(135deg, #E84F51 0%, #B23F44 35%, #162A7F 75%, #091133 100%)',
        'gradient-mesh':
          'radial-gradient(at 0% 0%, #162A7F 0%, transparent 50%), radial-gradient(at 100% 0%, #E84F51 0%, transparent 40%), radial-gradient(at 100% 100%, #0F1A5A 0%, transparent 60%), radial-gradient(at 0% 100%, #091133 0%, transparent 50%)',

        // Nuevos (equivalentes a los de Suscripcion-rcv, reproducen el isotipo "M")
        'gradient-brand-deep': 'linear-gradient(180deg, #091133 0%, #0F1A5A 100%)',
        'gradient-brand-logo': 'linear-gradient(135deg, #091133 0%, #0F1A5A 45%, #2E6DBF 100%)',
        'gradient-brand-full': 'linear-gradient(135deg, #0F1A5A 0%, #2E6DBF 55%, #E84F51 100%)',
      },
    },
  },
  plugins: [],
}
