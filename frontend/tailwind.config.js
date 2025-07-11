/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'
import colors from 'tailwindcss/colors'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        blue: {
          ...colors.blue,
          500: '#8e7cf2',
          600: '#7b68ee',
          700: '#6a56e3',
        },
      },
    },
  },
  plugins: [],
}
