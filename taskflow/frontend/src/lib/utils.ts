import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TaskPriority } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date relative to now
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      if (diffMinutes < 1) return "just now"
      return `${diffMinutes}m ago`
    }
    return `${diffHours}h ago`
  }

  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`

  return date.toLocaleDateString()
}

// Format date for display
export function formatDate(dateString: string | null): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  })
}

// Check if date is overdue
export function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

// Check if date is due soon (within 3 days)
export function isDueSoon(dateString: string | null): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  const today = new Date()
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
  today.setHours(0, 0, 0, 0)
  return date >= today && date <= threeDaysFromNow
}

// Get priority color class
export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    urgent: "priority-urgent",
    high: "priority-high",
    medium: "priority-medium",
    low: "priority-low",
    none: "priority-none",
  }
  return colors[priority] || colors.none
}

// Get priority label
export function getPriorityLabel(priority: TaskPriority): string {
  const labels: Record<TaskPriority, string> = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
    none: "No priority",
  }
  return labels[priority] || labels.none
}

// Generate initials from name
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Generate a random color for labels
export function generateRandomColor(): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a855f7", // purple
    "#d946ef", // fuchsia
    "#ec4899", // pink
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Validate project key format (2-5 uppercase letters)
export function isValidProjectKey(key: string): boolean {
  return /^[A-Z]{2,5}$/.test(key)
}

// Generate a slug from text
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + "..."
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// Calculate position between two positions (for drag and drop)
export function calculatePosition(before: number | null, after: number | null): number {
  if (before === null && after === null) return 0
  if (before === null) return after! - 1
  if (after === null) return before + 1
  return (before + after) / 2
}

// Convert plain text to Tiptap JSON
export function textToTiptap(text: string): { type: "doc"; content: { type: string; content?: { type: string; text: string }[] }[] } {
  if (!text.trim()) {
    return { type: "doc", content: [] }
  }

  return {
    type: "doc",
    content: text.split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : undefined,
    })),
  }
}

// Convert Tiptap JSON to plain text
export function tiptapToText(content: unknown): string {
  if (!content || typeof content !== "object") return ""

  const doc = content as { content?: { content?: { text?: string }[] }[] }
  if (!doc.content) return ""

  return doc.content
    .map((node) => {
      if (!node.content) return ""
      return node.content.map((child) => child.text || "").join("")
    })
    .join("\n")
}
