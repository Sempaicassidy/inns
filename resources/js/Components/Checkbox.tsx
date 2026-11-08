import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded-md border-slate-300 text-[#1E3A5F] shadow-xs focus:ring-[#D4AF37] focus:ring-offset-0 ' +
                className
            }
        />
    );
}
