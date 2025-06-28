import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const KPICard = ({ title, value, trend }) => {
    return (_jsxs("div", { className: "kpi-card", children: [_jsx("h3", { children: title }), _jsx("p", { children: value }), trend && _jsx("span", { className: `trend-${trend}` }), _jsx("p", { children: "KPICard Placeholder" })] }));
};
export default KPICard;
