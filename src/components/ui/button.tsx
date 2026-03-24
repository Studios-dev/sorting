import type { ComponentProps } from "react";
import { cn } from "@/lib/utils.ts";

const buttonBaseClass = "rounded-2xl cursor-pointer disabled:cursor-not-allowed px-8 py-2.5";

const buttonVariants = {
  primary:
    "bg-neutral-200 text-neutral-900 hover:bg-neutral-300 not-disabled:active:scale-97 transition-[colors,scale] disabled:bg-neutral-300",
  secondary:
    "bg-neutral-900 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 hover:border-neutral-600 transition-all",
} as const;

type ButtonVariant = keyof typeof buttonVariants;

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonBaseClass, buttonVariants[variant], className)}
      {...props}
    />
  );
}
