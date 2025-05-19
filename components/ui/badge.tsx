import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  status?: "active" | "inactive" | "pending"
}

function Badge({ className, variant, status, ...props }: BadgeProps) {
  // Si se proporciona un status, determinar la variante automáticamente
  let badgeVariant = variant
  if (status) {
    switch (status) {
      case "active":
        badgeVariant = "success"
        break
      case "inactive":
        badgeVariant = "secondary"
        break
      case "pending":
        badgeVariant = "warning"
        break
    }
  }

  return <div className={cn(badgeVariants({ variant: badgeVariant }), className)} {...props} />
}

export { Badge, badgeVariants }
