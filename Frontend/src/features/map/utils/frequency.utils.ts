export function calculateFrequency(count: number, total: number): number {
  if (total <= 0) {
    return 0
  }

  return count / total
}

export function formatFrequencyPercentage(frequency: number): string {
  const percentage = frequency * 100

  if (Number.isInteger(percentage)) {
    return `${percentage}%`
  }

  return `${percentage.toFixed(1)}%`
}
