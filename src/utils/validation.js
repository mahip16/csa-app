// src/utils/validation.js

export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function validatePassword(password) {
  return password.length >= 6
}

export function validateStudentId(studentId) {
  return /^\d{9}$/.test(studentId)
}

export function validatePdfFile(file) {
  if (!file) return { valid: false, error: "No file selected." }
  if (file.type !== "application/pdf") return { valid: false, error: "Only PDF files are allowed." }
  if (file.size > 10 * 1024 * 1024) return { valid: false, error: "File must be under 10MB." }
  return { valid: true, error: null }
}

export function validateRequiredFields(fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (!value || value.trim() === "") return `${key} is required.`
  }
  return null
}