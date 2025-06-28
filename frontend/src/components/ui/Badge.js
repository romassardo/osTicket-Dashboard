import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const Badge = ({ children, colorScheme = 'gray', variant = 'subtle', className, }) => {
    const baseStyle = 'badge';
    const colorStyle = `badge-${colorScheme}`;
    const variantStyle = `badge-${variant}`;
    return (_jsx("span", { className: `${baseStyle} ${colorStyle} ${variantStyle} ${className || ''}`.trim(), children: children }));
};
export default Badge;
