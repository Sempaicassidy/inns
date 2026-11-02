import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `btn btn-primary inline-flex items-center justify-center rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition duration-150 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98] ${
                    disabled && 'opacity-50 cursor-not-allowed'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
