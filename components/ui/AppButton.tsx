
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";

export type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning" | "dark" | "white";
export type AppButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<AppButtonVariant, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
    secondary: "bg-white text-slate-600 hover:bg-slate-50 border-slate-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent",
    danger: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-100",
    success: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100",
    warning: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100",
    dark: "bg-slate-950 text-white hover:bg-slate-800 border-slate-950",
    white: "bg-white text-slate-950 hover:bg-slate-100 border-white"
};

const buttonSizes: Record<AppButtonSize, string> = {
    sm: "h-9 rounded-xl px-3 text-xs",
    md: "h-10 rounded-2xl px-4 text-sm",
    lg: "h-12 rounded-2xl px-5 text-sm"
};

export type AppButtonBaseProps = {
    children: ReactNode;
    variant?: AppButtonVariant;
    size?: AppButtonSize;
    icon?: ComponentType<{ className?: string }>;
    iconRight?: ComponentType<{ className?: string }>;
    className?: string;
};

export type AppButtonProps = AppButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function AppButton({
                              children,
                              variant = "secondary",
                              size = "md",
                              icon: Icon,
                              iconRight: IconRight,
                              className = "",
                              ...props
                          }: AppButtonProps) {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 border font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
        >
            {Icon && <Icon className="h-4 w-4" />}
            {children}
            {IconRight && <IconRight className="h-4 w-4" />}
        </button>
    );
}

export type AppLinkButtonProps = AppButtonBaseProps & {
    href: string;
};

export function AppLinkButton({
                                  href,
                                  children,
                                  variant = "secondary",
                                  size = "md",
                                  icon: Icon,
                                  iconRight: IconRight,
                                  className = ""
                              }: AppLinkButtonProps) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center justify-center gap-2 border font-black shadow-sm transition ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
        >
            {Icon && <Icon className="h-4 w-4" />}
            {children}
            {IconRight && <IconRight className="h-4 w-4" />}
        </Link>
    );
}

export default AppButton;

