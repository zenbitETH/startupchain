export function formatDate(value?: Date): string {
  if (!value) return 'Pending'
  return value.toLocaleString()
}
