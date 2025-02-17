import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS classes
 * @param  {...string} inputs - Class names to merge
 * @returns {string} - Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Format a date string
 * @param {string} date - Date string
 * @returns {string} - Formatted date
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
} 