/** @type {import('tailwindcss').Config} */
import tokens from './tokens.json' assert { type: 'json' };

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        'brand-primary': tokens.color.brand.primary,
        'brand-secondary': tokens.color.brand.secondary,
        'brand-accent': tokens.color.brand.accent,

        // Surface colors
        'surface-base': tokens.color.surface.base,
        'surface-muted': tokens.color.surface.muted,
        'surface-elevated': tokens.color.surface.elevated,

        // Status colors
        'status-success': tokens.color.status.success.bg,
        'status-success-border': tokens.color.status.success.border,
        'status-success-text': tokens.color.status.success.text,

        'status-warning': tokens.color.status.warning.bg,
        'status-warning-border': tokens.color.status.warning.border,
        'status-warning-text': tokens.color.status.warning.text,

        'status-danger': tokens.color.status.danger.bg,
        'status-danger-border': tokens.color.status.danger.border,
        'status-danger-text': tokens.color.status.danger.text,

        'status-info': tokens.color.status.info.bg,
        'status-info-border': tokens.color.status.info.border,
        'status-info-text': tokens.color.status.info.text,

      },

      borderRadius: {
        'card-sm': tokens.border.radius.sm,
        'card-md': tokens.border.radius.md,
        'card-lg': tokens.border.radius.lg,
        'card-xl': tokens.border.radius.xl,
        'btn-full': tokens.border.radius.full,
      },

      colors: {
        // Keep existing colors and add new ones
        'text-primary': tokens.accessibility.contrast.textOnLight,
        'text-on-dark': tokens.accessibility.contrast.textOnDark,
        'text-muted': tokens.accessibility.contrast.textMuted,
      },

      ringColor: {
        'focus': 'rgba(59, 130, 246, 0.5)',
      },

      ringOffsetWidth: {
        'focus': tokens.accessibility.focus.ringOffset,
      },

      outlineWidth: {
        'focus': '2px',
      },

      outlineColor: {
        'focus': 'transparent',
      },

      outlineOffset: {
        'focus': tokens.accessibility.focus.outlineOffset,
      },

      borderWidth: {
        '2': tokens.border.width.sm,
        '3': tokens.border.width.md,
        '4': tokens.border.width.lg,
      },

      borderColor: {
        'default': tokens.border.color.default,
        'muted': tokens.border.color.muted,
      },

      fontFamily: {
        'primary': tokens.typography.fontFamily.primary,
        'display': tokens.typography.fontFamily.display,
        'accent': tokens.typography.fontFamily.accent,
      },

      fontWeight: {
        'normal': tokens.typography.fontWeight.normal,
        'medium': tokens.typography.fontWeight.medium,
        'semibold': tokens.typography.fontWeight.semibold,
        'bold': tokens.typography.fontWeight.bold,
      },

      fontSize: {
        'xs': tokens.typography.fontSize.xs,
        'sm': tokens.typography.fontSize.sm,
        'base': tokens.typography.fontSize.base,
        'lg': tokens.typography.fontSize.lg,
        'xl': tokens.typography.fontSize.xl,
        '2xl': tokens.typography.fontSize['2xl'],
        '3xl': tokens.typography.fontSize['3xl'],
      },

      lineHeight: {
        'tight': tokens.typography.lineHeight.tight,
        'normal': tokens.typography.lineHeight.normal,
        'relaxed': tokens.typography.lineHeight.relaxed,
      },

      spacing: {
        'btn-sm-px': tokens.spacing.button.sm.px,
        'btn-sm-py': tokens.spacing.button.sm.py,
        'btn-md-px': tokens.spacing.button.md.px,
        'btn-md-py': tokens.spacing.button.md.py,
        'btn-lg-px': tokens.spacing.button.lg.px,
        'btn-lg-py': tokens.spacing.button.lg.py,

        'card-sm': tokens.spacing.card.sm.p,
        'card-md': tokens.spacing.card.md.p,
        'card-lg': tokens.spacing.card.lg.p,

      },

      transitionDuration: {
        'fast': tokens.animation.duration.fast,
        'normal': tokens.animation.duration.normal,
        'slow': tokens.animation.duration.slow,
      },

      transitionTimingFunction: {
        'ease': tokens.animation.easing.ease,
        'ease-in': tokens.animation.easing.easeIn,
        'ease-out': tokens.animation.easing.easeOut,
        'ease-in-out': tokens.animation.easing.easeInOut,
      },

      transform: {
        'hover-lift': tokens.animation.transform.hover.lift,
        'hover-lift-more': tokens.animation.transform.hover.liftMore,
        'hover-press': tokens.animation.transform.hover.press,
      },

      boxShadow: {
        'sm': tokens.shadow.sm,
        'md': tokens.shadow.md,
        'lg': tokens.shadow.lg,
        'xl': tokens.shadow.xl,
      },

      maxHeight: {
        'modal': tokens.spacing.modal.maxHeight,
      },
    },
  },
  plugins: [],
}
