'use client';

import { useState } from 'react';
import Link from 'next/link';

type Props = {
  type: string;
  className?: string;
};

const textStyle: React.CSSProperties = {
  WebkitTextStroke: '1px black',
  textShadow: '1px 1px 2px black',
};

export default function TypeBadge({ type, className = 'h-7' }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  const href  = `/wiki/type/${type.toLowerCase()}`;

  if (imgFailed) {
    return (
      <Link href={href} className="relative inline-flex items-center justify-center rounded px-2 h-7 bg-gray-600">
        <span className="text-white font-bold text-xs uppercase" style={textStyle}>
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className="relative inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/types/${type.toLowerCase()}.png`}
        alt={label}
        className={className}
        onError={() => setImgFailed(true)}
      />
      <span
        className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs uppercase pointer-events-none"
        style={textStyle}
      >
        {label}
      </span>
    </Link>
  );
}
