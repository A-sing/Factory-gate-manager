// DBS FACTORY design tokens (Light theme - green + yellow, all text black)
export const colors = {
  primary: "#FACC15",          // bright yellow
  primaryFg: "#000000",        // black text on yellow
  secondary: "#16A34A",        // green (brand)
  secondaryFg: "#000000",      // black text on green
  background: "#F4FBF4",       // very light green tint
  surface: "#FFFFFF",
  surfaceElevated: "#F0FDF4",
  border: "#D1FAE5",           // soft green border
  borderStrong: "#16A34A",
  success: "#15803D",
  successBg: "#DCFCE7",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  danger: "#DC2626",
  dangerBg: "#FEE2E2",
  info: "#0EA5E9",
  infoBg: "#E0F2FE",
  text: "#000000",             // all text true black
  textMuted: "#374151",        // dark gray for secondary info
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { none: 0, sm: 4, md: 6, lg: 8, pill: 999 };

export const fonts = {
  body: "System",
};

// Solid offset shadow
export const brutalShadow = {
  shadowColor: colors.secondary,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
};

export const LABOUR_CATEGORIES = [
  "Welder",
  "Fitter",
  "Electrician",
  "Helper",
  "Carpenter",
  "Painter",
  "Other",
];
