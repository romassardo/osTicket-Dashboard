import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const Loading = ({ size = 'md', text }) => {
    // Basic spinner, consider using SVG or a library for better visuals
    const sizeClass = `spinner-${size}`;
    return (_jsxs("div", { className: "loading-container", children: [_jsx("div", { className: `spinner ${sizeClass}` }), text && _jsx("p", { className: "loading-text", children: text }), _jsx("p", { children: "Loading Placeholder" })] }));
};
export default Loading;
