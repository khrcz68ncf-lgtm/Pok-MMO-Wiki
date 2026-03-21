'use client';

import ReactMarkdown from 'react-markdown';

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold mt-8 mb-4 text-white">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-semibold mt-6 mb-3 text-white">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-semibold mt-5 mb-2 text-gray-100">{children}</h3>
        ),
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
