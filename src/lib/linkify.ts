import { createElement, type ReactNode } from "react";

// Regex segura para detectar URLs http/https
const URL_REGEX = /https?:\/\/[^\s<>"']+/g;

/**
 * Convierte URLs en texto plano a elementos <a> clicables.
 * Devuelve un array de ReactNode (strings y elementos <a>).
 */
export function linkifyText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = match[0];
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    nodes.push(
      createElement(
        "a",
        {
          key: start,
          href: url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "break-all underline text-primary hover:text-primary/80",
        },
        url
      )
    );

    lastIndex = start + url.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
