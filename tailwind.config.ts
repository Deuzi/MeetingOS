import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        "bg-elevated": "#141414",
        fg: "#F5F5F0",
        "fg-dim": "#8A8A85",
        line: "#2A2A28",
        accent: "#FFFFFF",
        flag: "#FF3B30",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Space Mono", "Courier New", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0",
        none: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
      },
    },
  },
  plugins: [],
};

export default config;
