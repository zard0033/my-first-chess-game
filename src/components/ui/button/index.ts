import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './button.vue'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn font-medium leading-none select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-fg shadow-button hover:bg-primary-dark',
        secondary: 'bg-surface-card text-ink border border-line hover:bg-surface-hover',
        danger: 'bg-danger text-danger-fg shadow-button hover:bg-danger-dark',
        outline: 'border border-line bg-transparent text-ink hover:bg-surface-hover',
        ghost: 'text-ink hover:bg-surface-hover',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-[44px] px-5',
        sm: 'min-h-[36px] px-3 text-sm',
        lg: 'min-h-[52px] px-8 text-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
