'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function EditPageClient({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-gray-800">
        {/* Editor */}
        <div className="flex flex-col">
          <div className="px-4 py-2.5 bg-gray-900 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Markdown
          </div>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full bg-gray-950 text-gray-200 px-4 py-4 text-sm font-mono leading-relaxed resize-none focus:outline-none min-h-[520px]"
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        <div className="flex flex-col">
          <div className="px-4 py-2.5 bg-gray-900 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Preview
          </div>
          <div className="flex-1 px-5 py-4 overflow-y-auto text-sm text-gray-300 leading-relaxed min-h-[520px]">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-white">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-2 text-white">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-100">{children}</h3>,
                p: ({ children }) => <p className="mb-3 text-gray-300">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-300">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-300">{children}</ol>,
                li: ({ children }) => <li className="ml-3">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-gray-800 text-red-300 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-800 border border-gray-700 rounded p-3 mb-3 overflow-x-auto text-xs">{children}</pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-red-500 pl-3 italic text-gray-400 mb-3">{children}</blockquote>
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-red-400 underline hover:text-red-300">{children}</a>
                ),
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                hr: () => <hr className="border-gray-700 my-4" />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
