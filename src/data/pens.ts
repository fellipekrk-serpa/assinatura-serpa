export type PenType =
  | 'ultra-fine'
  | 'fine'
  | 'medium'
  | 'thick'
  | 'super-thick'
  | 'flex'
  | 'ultra-flex'
// Nominal screen widths at 96 CSS px/in; millimeters are indicative, not hardware calibration.
export const PEN_PRESETS: { id: PenType; label: string; width: number }[] = [
  { id: 'ultra-fine', label: 'Ultra fina · 0,3 mm', width: (0.3 * 96) / 25.4 },
  { id: 'fine', label: 'Fina · 0,6 mm', width: (0.6 * 96) / 25.4 },
  { id: 'medium', label: 'Média · 1,0 mm', width: 96 / 25.4 },
  { id: 'thick', label: 'Grossa · 1,2 mm', width: (1.2 * 96) / 25.4 },
  { id: 'super-thick', label: 'Super grossa · 1,6 mm', width: (1.6 * 96) / 25.4 },
  { id: 'flex', label: 'Flex · pressão suave', width: 96 / 25.4 },
  { id: 'ultra-flex', label: 'Ultra Flex · maior variação', width: 96 / 25.4 },
]
