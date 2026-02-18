import type { ButtonHTMLAttributes, FC, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'transparent' | 'light';
}

export const IconButton: FC<IconButtonProps> = ({
    children,
    className = '',
    variant = 'transparent',
    ...props
}) => {
    const variantClass = variant === 'primary' ? 'bg-light-primary' : '';

    return (
        <button
            {...props}
            type={props.type || 'button'}
            className={`icon-btn button-effect ${variantClass} ${className}`}
        >
            {children}
        </button>
    );
};