/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1890ff",
          light: "#40a9ff",
          dark: "#096dd9",
        },
        antd: {
          blue: "#1890ff",
          green: "#52c41a",
          red: "#ff4d4f",
          gold: "#faad14",
        },
      },
    },
  },
  plugins: [],
};
