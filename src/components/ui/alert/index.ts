import { cva, type VariantProps } from 'class-variance-authority'

export { default as Alert } from './alert.vue'
export { default as AlertTitle } from './alert-title.vue'
export { default as AlertDescription } from './alert-description.vue'

export const alertVariants = cva('relative w-full rounded-card border p-4', {
  variants: {
    variant: {
      default: 'bg-surface-card border-line text-ink',
      hint: 'bg-hint-light border-hint-ring/60 text-hint-fg',
      success: 'bg-success-light border-success/40 text-ink',
      danger: 'bg-danger-light border-danger/40 text-ink',
    },
  },
  defaultVariants: { variant: 'default' },
})

export type AlertVariants = VariantProps<typeof alertVariants>
