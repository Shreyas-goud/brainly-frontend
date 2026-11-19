/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: {
          DEFAULT: token("surface"),
          2: token("surface-2"),
          3: token("surface-3"),
        },
        ink: {
          DEFAULT: token("ink"),
          2: token("ink-2"),
          3: token("ink-3"),
        },
        line: {
          DEFAULT: token("line"),
          strong: token("line-strong"),
        },
        accent: {
          DEFAULT: token("accent"),
          ink: token("accent-ink"),
          soft: token("accent-soft"),
        },
        danger: {
          DEFAULT: token("danger"),
          soft: token("danger-soft"),
        },
        success: token("success"),
        inverse: {
          DEFAULT: token("inverse"),
          ink: token("inverse-ink"),
        },
      },
      fontFamily: {
        sans: ['"Geist Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono Variable"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        display: "-0.035em",
        title: "-0.025em",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.04), 0 2px 8px -2px rgb(var(--shadow) / 0.06)",
        lift: "0 2px 4px rgb(var(--shadow) / 0.04), 0 16px 32px -12px rgb(var(--shadow) / 0.18)",
        float: "0 8px 16px -6px rgb(var(--shadow) / 0.12), 0 32px 64px -24px rgb(var(--shadow) / 0.28)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "caret-blink": {
          "0%, 70%, 100%": { opacity: "1" },
          "20%, 50%": { opacity: "0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "caret-blink": "caret-blink 1.1s ease-out infinite",
      },
    },
  },
  plugins: [],
};
