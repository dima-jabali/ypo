import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isValidNumber = (value: unknown): value is number =>
  value === 0 ? true : Number.isFinite(value || undefined);
