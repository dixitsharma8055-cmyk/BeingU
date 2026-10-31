// BeingU design tokens.
// Colours were sampled from the official logo file (apps/mobile/assets/brand/beingu-logo-original.png).
// Do not change these to match generic templates; change them only with the founder's approval.

export const colors = {
  background: '#FEFCF9', // warm off-white (logo background)
  ink: '#11041A', // near-black plum (logo wordmark and tagline)
  inkMuted: '#5B4A66', // secondary text (derived for contrast on background)
  purple: '#A465E2', // logo "U" base
  lilac: '#D18FFC', // logo "i" dot
  pink: '#F07095', // logo "U" upper stroke
  orange: '#FEAB65', // logo "U" top-right stroke and dot
  white: '#FFFFFF',
  highlightSoft: '#FFF1D6', // derived pale tint for notices (not sampled from the logo)
} as const;

export const gradients = {
  // Used sparingly for accents (primary button, highlights), never as full-screen backgrounds.
  brand: [colors.purple, colors.pink, colors.orange] as const,
} as const;

export const fonts = {
  // Plus Jakarta Sans for headings, Inter for body. Loaded with expo-font in a later step.
  heading: 'PlusJakartaSans-Bold',
  body: 'Inter-Regular',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { md: 12, lg: 16, pill: 999 } as const;
