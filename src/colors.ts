// The home-screen widgets' colours (widget.tsx; iosWidgetLayout.ios.tsx keeps
// a copy). Unchanged by the app's restyle (WBS 9.1); the app uses theme.ts.
export const colors = {
  background: '#F7F3EC',
  surface: '#FFFDF8',
  border: '#E3DACD',
  text: '#3D352E',
  muted: '#8A7F73',
  accent: '#B5651D',
  placeholder: '#EDE7DD',
  success: '#4E7A3A',
  danger: '#B3261E',
} as const;
