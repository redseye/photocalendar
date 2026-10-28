// The app's look (WBS 9.1, 9.2): beige paper, rounded cards with soft shadows,
// muted blue / orange accents and serif headings. The home-screen widgets keep
// their earlier look and their own colours (colors.ts).
export const palette = {
  background: '#F3EEE5', // paper
  surface: '#FBF8F2', // cards
  sunken: '#ECE5D8', // placeholders, input boxes, pressed buttons
  border: '#E2D8C8',
  text: '#3A3631',
  heading: '#2C3442', // deep ink for titles
  muted: '#8B8276',
  accent: '#4D6890', // muted blue: today, the current item
  accentSoft: '#DFE5EE',
  warm: '#CF8A4E', // muted orange: note markers
  success: '#5A7D48',
  danger: '#B3261E',
} as const;

export const radius = { md: 14, lg: 20, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16 } as const;

// Text sizes, largest first.
export const fontSize = {
  display: 30,
  title: 22,
  heading: 18,
  body: 16,
  label: 14,
  caption: 13,
  small: 12,
} as const;

// Titles use Noto Serif TC Regular, embedded in the native app by the expo-font
// config plugin (app.json), so Android and iOS draw the same Traditional
// Chinese glyphs. The bundled file is a subset (the full font is about 10 MB):
// printable ASCII plus the characters in App.tsx and src/, which includes the
// questions and resource names. After changing that text run `npm run gen-font`;
// `npm run check-font` lists characters the subset lacks. Android finds the
// font by file name and iOS by PostScript name; both are NotoSerifTC-Regular.
// Only Regular is bundled: don't give serif text a bold fontWeight or an italic
// fontStyle, or Android looks for a bold/italic file and uses the system font.
export const serif = 'NotoSerifTC-Regular';

// Soft shadow under cards. Android draws it from Android 9 on.
export const shadow = { boxShadow: '0px 2px 10px rgba(74, 58, 40, 0.10)' } as const;
