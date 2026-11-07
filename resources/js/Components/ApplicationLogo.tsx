import React, { ImgHTMLAttributes, useEffect, useState } from 'react';
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
    // Resolve initial source based on environment
    const getInitialSrc = (): string => {
        if (src) return src;

        let initial = typeof logoImg === 'string' ? logoImg : '/logo.png';

        // If on cPanel / production domain root (not running under /inns)
        if (typeof window !== 'undefined') {
            const path = window.location.pathname || '';
            const isUnderInns = path.startsWith('/inns');
            if (!isUnderInns && initial.startsWith('/inns/')) {
                initial = initial.replace(/^\/inns\//, '/');
            }
        }

        return initial;
    };

    const [imgSrc, setImgSrc] = useState<string>(getInitialSrc);
    const [retryCount, setRetryCount] = useState<number>(0);

    // Sync when src prop changes
    useEffect(() => {
        setImgSrc(getInitialSrc());
        setRetryCount(0);
    }, [src]);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if (retryCount === 0) {
            setRetryCount(1);
            // If imgSrc contains /inns/, strip it
            if (imgSrc.includes('/inns/')) {
                setImgSrc(imgSrc.replace('/inns/', '/'));
            } else {
                setImgSrc('/logo.png');
            }
        } else if (retryCount === 1) {
            setRetryCount(2);
            setImgSrc('/images/logo.png');
        } else if (retryCount === 2) {
            setRetryCount(3);
            setImgSrc('/build/assets/logo-KX48dFGA.png');
        } else if (retryCount === 3) {
            setRetryCount(4);
            setImgSrc('logo.png');
        }

        props.onError?.(e);
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            onError={handleError}
            className={`object-contain rounded-full select-none ${className}`}
            {...props}
        />
    );
}
