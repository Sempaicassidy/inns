import React, { ImgHTMLAttributes } from 'react';
import logoImg from '../../images/logo.png';

interface ApplicationLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    size?: number | string;
}

export default function ApplicationLogo({
    className = 'w-16 h-16',
    alt = 'THE INNS',
    src,
    ...props
}: ApplicationLogoProps) {
    return (
        <img
            src={src || logoImg}
            alt={alt}
            className={`object-contain rounded-full select-none ${className}`}
            {...props}
        />
    );
}
