// src/lib/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitize(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // Solo texto plano
    ALLOWED_ATTR: [],
  });
}