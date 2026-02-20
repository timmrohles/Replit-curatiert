import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr', 'span', 'div',
  'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup',
  'a', 'img',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'blockquote', 'pre', 'code',
  'figure', 'figcaption',
  'section', 'article', 'aside',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'title', 'alt',
  'src', 'width', 'height', 'loading',
  'class', 'id', 'style',
  'colspan', 'rowspan',
];

export function sanitizeHTML(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
  });
}
