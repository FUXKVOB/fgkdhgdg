module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // кастомные эффекты
    "glass",
    "glass-strong",
    "glass-light",
    "glass-strong-light",
    "glow-text",
    "glow-text-strong",
    "glow-box",
    "glow-box-strong",
    "hover-lift",
    "hover-glow",
    "backdrop-blur-strong",
    "border-gradient",
    "liquid-bg",
    "gradient-text",

    // message bubbles
    "message-user",
    "message-ai",

    // premium scrollbar
    "scrollbar-premium",

    // кнопки
    "btn-primary",
    "btn-secondary",

    // анимации
    "animate-message-slide-in",
    "animate-fade-in-up",
    "animate-slide-in-left",
    "animate-slide-in-right",
    "animate-slide-in-up",
    "animate-float",
    "animate-float-delayed",
    "animate-float-slow",
    "animate-pulse-glow",
    "animate-avatar-glow",
    "animate-bounce-subtle",
    "animate-gradient",
    "animate-neon-border",
    "animate-shimmer",
    "animate-morphing",
    "animate-particle-float",
    "animate-text-reveal",
    "animate-button-pulse",
    "animate-liquid-wave",

    // другие утилиты
    "text-shadow-lg",
    "text-shadow-xl",
    "neon-cyan",
    "neon-purple",
    "neon-pink",
    "gpu-accelerated",
    "optimize-animations",
    "floating-particles",
    "loading-dots"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
