import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0E0E10",
          secondary: "#111111",
        },
        primary: "#00C4FF",
        accent: "#00FFE0",
        text: {
          DEFAULT: "#EAF9FF",
          secondary: "#B0B0B0",
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #00C4FF 0%, #00FFE0 100%)",
      },
    },
  },
  plugins: [],
};
export default config;


