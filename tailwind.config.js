/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./*.html", "./collections/**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        "primary": "#e8a6a6",
        "primary-hover": "#D98F8F",
        "accent-gold": "#D4AF37",
        "accent-gold-dark": "#B8962F",
        "accent-teal": "#4DB6AC",
        "accent-teal-dark": "#2F8F86",
        "divider": "#B48CB8",
        "lavender": "#C8A2C8",
        "lavender-soft": "#EDE3F1",
        "background-cream": "#F5F5F0",
        "text-main": "#191010",
        "text-secondary": "#6B6B6B",
        "border-light": "#DDD8CF",
      },
      fontFamily: {
        "display": ["Lato", "sans-serif"],
        "serif": ["Playfair Display", "serif"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}

