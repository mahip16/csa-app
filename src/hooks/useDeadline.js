// src/hooks/useDeadline.js

export function useDeadline(deadlineDate) {
  if (!deadlineDate) return { label: "No deadline set", overdue: false, daysLeft: null }

  const now = new Date()
  const deadline = new Date(deadlineDate)
  const diffMs = deadline - now
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return { label: "Overdue", overdue: true, daysLeft }
  if (daysLeft === 0) return { label: "Due today", overdue: false, daysLeft }
  return { label: `${daysLeft} days left`, overdue: false, daysLeft }
}