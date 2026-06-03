import { cva, type VariantProps } from 'class-variance-authority'

export { default as Badge } from './badge.vue'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-fg',
        secondary: 'border-transparent bg-surface-raised text-ink',
        success: 'border-transparent bg-success-light text-success-dark',
        danger: 'border-transparent bg-danger-light text-danger-dark',
        hint: 'border-transparent bg-hint-light text-hint-dark',
        outline: 'border-line text-ink',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
