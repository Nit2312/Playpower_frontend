import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Count words in HTML content, excluding HTML tags
 */
export function countWords(htmlContent: string): number {
  if (!htmlContent) return 0
  
  // Remove HTML tags and decode HTML entities
  const textContent = htmlContent
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Replace other HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  if (!textContent) return 0
  
  // Split by whitespace and filter out empty strings
  return textContent.split(/\s+/).filter(word => word.length > 0).length
}