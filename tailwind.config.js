module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        stellar: {
          primary: "#3E1BDB",
          "primary-focus": "#3416b6",
          "primary-content": "#ffffff",
          secondary: "#FFB200",
          "secondary-focus": "#d69600",
          "secondary-content": "#ffffff",
          accent: "#FF434B",
          "accent-focus": "#f73640",
          "accent-content": "#ffffff",
          neutral: "#3d4451",
          "neutral-focus": "#2a2e37",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#d1d5db",
          "base-content": "#1f2937",
          info: "#2094f3",
          success: "#009485",
          warning: "#ff9900",
          error: "#ff5724"
        }
      },
      "dark"
    ]
  }
};
