/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#18323a',
        tide: '#167a91',
        coral: '#e9795e',
        mist: '#f5f7f8',
      },
    },
  },
  plugins: [],
};
