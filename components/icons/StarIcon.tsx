
import React from 'react';

// FIX: Define custom props to include an optional title and render an SVG <title> element for accessibility, which resolves the TS error.
interface StarIconProps extends React.SVGProps<SVGSVGElement> {
    title?: string;
}

export const StarIcon: React.FC<StarIconProps> = ({ title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="none" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.321h5.367c.57 0 .814.686.417 1.076l-4.34 3.155a.563.563 0 0 0-.162.632l1.634 5.73c.194.686-.522 1.256-1.125.861l-4.78-3.473a.563.563 0 0 0-.656 0l-4.78 3.473c-.603.395-1.32.025-1.125-.861l1.634-5.73a.563.563 0 0 0-.162-.632l-4.34-3.155C1.499 9.617 1.744 8.923 2.314 8.923h5.367a.563.563 0 0 0 .475-.321L11.48 3.5Z" />
    </svg>
);
