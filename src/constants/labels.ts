/** The fixed set of color labels available on cards. */
export const LABEL_COLORS = [
  { name: 'Red', value: 'red', bg: 'bg-red-500' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-500' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-400' },
  { name: 'Green', value: 'green', bg: 'bg-green-500' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-500' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-500' },
] as const

/** Map from label value to its Tailwind background class. */
export const LABEL_COLOR_MAP: Record<string, string> = Object.fromEntries(
  LABEL_COLORS.map((label) => [label.value, label.bg])
)
