// orchester — Nord-inspired purple theme
// Consistent color palette across all views

export const theme = {
  // Brand
  brand: '#b48ead',       // Nordic purple — primary brand color

  // Semantic
  success: '#a3be8c',     // Soft green
  warning: '#ebcb8b',     // Warm yellow
  error: '#bf616a',       // Muted red
  info: '#81a1c1',        // Blue-gray

  // UI
  accent: '#d8dee9',      // Light gray — key hints, emphasis
  muted: 'gray',          // Dim text, borders
  bar: '#b48ead',         // Charts, progress bars

  // Profile status
  installed: '#a3be8c',   // Green — installed
  onSystem: '#ebcb8b',    // Yellow — active on system
  custom: '#b48ead',      // Purple — custom entries
} as const;
