import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-kaffee-700 text-white hover:bg-kaffee-900 active:scale-[0.98] shadow-sm",
  secondary:
    "bg-kaffee-100 text-kaffee-900 hover:bg-kaffee-300/60 active:scale-[0.98]",
  ghost: "bg-transparent text-kaffee-900 hover:bg-kaffee-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-base rounded-lg",
  lg: "px-5 py-3 text-lg rounded-xl",
  xl: "px-6 py-4 text-xl rounded-2xl font-medium",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
