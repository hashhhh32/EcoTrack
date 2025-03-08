import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateAvatarUrl(email: string | undefined | null) {
  if (!email) return null;
  // Generate a consistent color based on the email
  const hash = email.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  const saturation = 70; // Fixed saturation for consistency
  const lightness = 60; // Fixed lightness for consistency
  
  // Create a data URL for a colored circle with initials
  const initials = email.substring(0, 2).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
      <circle cx="20" cy="20" r="20" fill="hsl(${hue}, ${saturation}%, ${lightness}%)" />
      <text x="20" y="25" font-family="Arial" font-size="16" fill="white" text-anchor="middle">${initials}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
