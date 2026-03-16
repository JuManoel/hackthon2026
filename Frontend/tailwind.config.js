/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          0: '#ffffff',
          50: '#f9f9f9',
          100: '#f1f1f1',
          300: '#c4c4c4',
          400: '#9a9a9a',
          500: '#707070',
          700: '#525252',
          800: '#3a3a3a',
          900: '#1f1f1f',
        },
        brand: {
          500: '#c1121f',
          700: '#525252',
        },
      },
      fontFamily: {
        base: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'title-1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'title-2': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'title-3': ['20px', { lineHeight: '28px', fontWeight: '700' }],
        subtitle: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-lg': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'label-md': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      boxShadow: {
        'soft-lg': '0 24px 56px rgba(44, 44, 44, 0.1)',
      },
    },
  },
  plugins: [],
}