import { C, F } from "../theme/tokens.js";

export const Ico = ({ d, size = 20, color = C.emerald, stroke = 1.6, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, display: "block", ...style }}
  >
    <path d={d} />
  </svg>
);

export const Pill = ({ children, bg = C.mint, color = C.emerald }) => (
  <span
    style={{
      background: bg,
      color,
      fontSize: 10,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 20,
      letterSpacing: 0.3,
      whiteSpace: "nowrap",
      ...F,
    }}
  >
    {children}
  </span>
);

export const Card = ({ children, style = {}, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "linear-gradient(180deg,rgba(255,255,255,.88),rgba(255,255,255,.76))",
      borderRadius: 22,
      boxShadow: "0 18px 42px rgba(41,110,73,.12),0 1px 2px rgba(13,61,43,.04)",
      border: "1px solid rgba(255,255,255,.82)",
      backdropFilter: "blur(14px)",
      overflow: "hidden",
      ...style,
      cursor: onClick ? "pointer" : undefined,
    }}
  >
    {children}
  </div>
);

export const controlStyle = (style = {}) => ({
  width: "100%",
  boxSizing: "border-box",
  border: `1.5px solid ${C.mint}`,
  borderRadius: 12,
  padding: "11px",
  fontSize: 13,
  color: C.ink,
  background: C.white,
  outline: "none",
  ...F,
  ...style,
});

export const inputShellStyle = (style = {}) => ({
  flex: 1,
  background: C.foam,
  borderRadius: 20,
  padding: "10px 16px",
  border: `1px solid ${C.mint}`,
  ...style,
});

export const buttonStyle = ({
  variant = "primary",
  disabled = false,
  style = {},
} = {}) => {
  const variants = {
    primary: {
      background: disabled ? C.pebble : C.emerald,
      color: C.white,
      border: "none",
      boxShadow: disabled ? "none" : "0 4px 12px rgba(26,102,69,.3)",
    },
    soft: {
      background: C.foam,
      color: C.stone,
      border: "none",
      boxShadow: "none",
    },
    mint: {
      background: C.mint,
      color: C.emerald,
      border: "none",
      boxShadow: "none",
    },
    danger: {
      background: "#fde8e6",
      color: C.risk,
      border: "none",
      boxShadow: "none",
    },
  };

  return {
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: disabled ? "default" : "pointer",
    ...F,
    ...(variants[variant] || variants.primary),
    ...style,
  };
};
