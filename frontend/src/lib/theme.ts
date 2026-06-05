// DBS FACTORY design tokens (Industrial neo-brutalist light theme)
export const colors = {
  primary: "#FFCC00",
  primaryFg: "#09090B",
  secondary: "#09090B",
  secondaryFg: "#FFFFFF",
  background: "#F4F4F5",
  surface: "#FFFFFF",
  surfaceElevated: "#FAFAFA",
  border: "#E4E4E7",
  borderStrong: "#09090B",
  success: "#16A34A",
  successBg: "#DCFCE7",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  danger: "#DC2626",
  dangerBg: "#FEE2E2",
  info: "#2563EB",
  infoBg: "#DBEAFE",
  text: "#09090B",
  textMuted: "#52525B",
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { none: 0, sm: 4, md: 6, lg: 8, pill: 999 };

export const fonts = {
  body: "System",
};

// Solid offset shadow (neo-brutalist)
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
