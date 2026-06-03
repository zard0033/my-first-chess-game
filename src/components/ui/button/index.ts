import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './button.vue'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn font-medium leading-none select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0',
  {
    variants: {
      variant: {
        default: [
          'bg-[url(/ui/buttonLong_brown.png)] bg-[length:100%_100%]',
          'text-[#fcf9f3] font-semibold !rounded-none !border-none !shadow-none',
          'active:bg-[url(/ui/buttonLong_brown_pressed.png)]',
          'hover:brightness-110',
        ].join(' '),
        secondary: [
          'bg-[url(/ui/buttonLong_beige.png)] bg-[length:100%_100%]',
          'text-ink font-semibold !rounded-none !border-none !shadow-none',
          'active:bg-[url(/ui/buttonLong_beige_pressed.png)]',
          'hover:brightness-105',
        ].join(' '),
        danger: 'bg-danger text-danger-fg shadow-button hover:bg-danger-dark rounded-btn',
        outline: 'border border-line bg-transparent text-ink hover:bg-surface-hover rounded-btn',
        ghost: 'text-ink hover:bg-surface-hover rounded-btn',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-[49px] px-6',
        sm: 'min-h-[36px] px-3 text-sm',
        lg: 'min-h-[52px] px-8 text-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
