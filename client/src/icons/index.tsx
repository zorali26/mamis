import React from "react";

const svg = (children: React.ReactNode, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const IconAssets = ({ size = 22 }: { size?: number }) => svg(<><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 12h10M7 8h6M7 16h4"/></>, size);
export const IconMarkets = ({ size = 22 }: { size?: number }) => svg(<><path d="M3 17l5-5 4 4 9-9"/><path d="M14 7h7v7"/></>, size);
export const IconProfile = ({ size = 22 }: { size?: number }) => svg(<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>, size);
export const IconLeader = ({ size = 22 }: { size?: number }) => svg(<><path d="M6 18V10M12 18V6M18 18v-4"/><path d="M3 21h18"/></>, size);
export const IconSettings = ({ size = 22 }: { size?: number }) => svg(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>, size);

// Stock icons (custom shapes)
export const StockIcon = ({ seed, size = 28 }: { seed: number; size?: number }) => {
  const colors = ["#22d3ee","#a78bfa","#f472b6","#fbbf24","#34d399","#60a5fa","#fb7185","#c084fc"];
  const c = colors[seed % colors.length];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="7" fill={c} opacity="0.18" />
      <rect x="2" y="2" width="28" height="28" rx="7" fill="none" stroke={c} strokeWidth="1.5" />
      <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="700" fill={c} fontFamily="monospace">
        {String.fromCharCode(65 + (seed % 26))}
      </text>
    </svg>
  );
};

// Appliance icons (custom drawn SVG, no emoji)
export const ApplianceIcon = ({ id, size = 40 }: { id: string; size?: number }) => {
  const s = size;
  const base = (children: React.ReactNode) => (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
  );
  switch (id) {
    case "house":
      return base(<><path d="M6 22V12L24 4l18 8v10"/><path d="M6 22h36"/><rect x="18" y="14" width="12" height="8" rx="1"/><path d="M24 4v4"/></>);
    case "fridge":
      return base(<><rect x="12" y="4" width="24" height="40" rx="3"/><path d="M12 22h24"/><circle cx="16" cy="13" r="1.5" fill="currentColor"/><circle cx="16" cy="31" r="1.5" fill="currentColor"/></>);
    case "washer":
      return base(<><rect x="8" y="6" width="32" height="36" rx="4"/><circle cx="24" cy="26" r="10"/><circle cx="24" cy="26" r="4"/><rect x="12" y="10" width="6" height="4" rx="1"/></>);
    case "dishwasher":
      return base(<><rect x="8" y="6" width="32" height="36" rx="3"/><path d="M12 14h24M12 20h24M12 26h24M12 32h24"/><circle cx="36" cy="10" r="2" fill="currentColor"/></>);
    case "tv":
      return base(<><rect x="4" y="8" width="40" height="26" rx="3"/><path d="M18 34h12M24 34v6M16 40h16"/><circle cx="24" cy="21" r="1.5" fill="currentColor"/></>);
    case "ac":
      return base(<><rect x="6" y="12" width="36" height="14" rx="3"/><path d="M10 30c2-2 4 2 6 0s4 2 6 0 4 2 6 0 4 2 6 0"/><path d="M12 16h24"/></>);
    case "microwave":
      return base(<><rect x="6" y="12" width="36" height="24" rx="3"/><rect x="10" y="16" width="20" height="16" rx="1"/><circle cx="38" cy="20" r="2"/><circle cx="38" cy="28" r="2"/><path d="M14 20h12"/></>);
    case "oven":
      return base(<><rect x="8" y="6" width="32" height="36" rx="3"/><rect x="12" y="14" width="24" height="20" rx="1"/><circle cx="16" cy="10" r="2"/><circle cx="24" cy="10" r="2"/><circle cx="32" cy="10" r="2"/></>);
    case "vacuum":
      return base(<><path d="M8 38h16v4H8z"/><path d="M16 38V20"/><circle cx="16" cy="14" r="6"/><path d="M22 14h14l4 6"/></>);
    case "iron":
      return base(<><path d="M10 28h28l-4-12H14z"/><path d="M14 16V10a4 4 0 0 1 4-4h4"/><circle cx="30" cy="22" r="1.5" fill="currentColor"/></>);
    case "hairdryer":
      return base(<><path d="M8 20h12l4-6h10a4 4 0 0 1 0 12H24l-4-6"/><circle cx="14" cy="20" r="3"/></>);
    default:
      return base(<circle cx="24" cy="24" r="10"/>);
  }
};
