/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: { preflight: false },   // no romper el CSS existente
  theme: {
    extend: {
      colors: {
        'tec-blue':        '#004277',
        'emprende-orange': '#E85D24',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans:  ['Inter', 'Poppins', 'sans-serif'],
      },
    },
  },
}
