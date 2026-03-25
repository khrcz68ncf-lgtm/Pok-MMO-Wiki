'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

// Extract {#anchor-id} from heading text, return clean display + id attribute.
// Handles both string children and array children from react-markdown.
function parseAnchorId(children: React.ReactNode): { id?: string; display: React.ReactNode } {
  if (typeof children === 'string') {
    const m = children.match(/^(.*?)\s*\{#([\w-]+)\}\s*$/);
    if (m) return { id: m[2], display: m[1] };
    return { display: children };
  }
  if (Array.isArray(children)) {
    const arr = children as React.ReactNode[];
    const last = arr[arr.length - 1];
    if (typeof last === 'string') {
      const m = last.match(/^(.*?)\s*\{#([\w-]+)\}\s*$/);
      if (m) return { id: m[2], display: [...arr.slice(0, -1), m[1]] };
    }
    return { display: children };
  }
  return { display: children };
}

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => {
          const { id, display } = parseAnchorId(children);
          return <h1 id={id} className="text-3xl font-bold mt-8 mb-4 text-white">{display}</h1>;
        },
        h2: ({ children }) => {
          const { id, display } = parseAnchorId(children);
          return <h2 id={id} className="text-2xl font-semibold mt-6 mb-3 text-white">{display}</h2>;
        },
        h3: ({ children }) => {
          const { id, display } = parseAnchorId(children);
          return <h3 id={id} className="text-xl font-semibold mt-5 mb-2 text-gray-100">{display}</h3>;
        },
        p: ({ children }) => (
          <p className="mb-4 text-gray-300 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 space-y-1 text-gray-300">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-300">{children}</ol>
        ),
        li: ({ children }) => <li className="ml-4">{children}</li>,
        code: ({ children }) => (
          <code className="bg-gray-800 text-red-300 px-1.5 py-0.5 rounded text-sm font-mono">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 overflow-x-auto text-sm">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-red-500 pl-4 italic text-gray-400 mb-4">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-red-400 hover:text-red-300 underline transition-colors">
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        hr: () => <hr className="border-gray-700 my-6" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
