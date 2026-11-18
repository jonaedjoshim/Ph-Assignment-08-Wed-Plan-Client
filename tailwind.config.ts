import { heroui } from "@heroui/react";

const config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wedplan: {
          ink: "#2d2725",
          cream: "#fffaf7",
          rose: "#96575b",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};

export default config;
