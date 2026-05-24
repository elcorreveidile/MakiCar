import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

function MakiIcon({ size }: { size: number }) {
  const pad = size * 0.12;
  const inner = size - pad * 2;

  return (
    <div
      style={{
        width: size,
        height: size,
        background: '#0A0E1A',
        borderRadius: size * 0.22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 72 72"
        fill="none"
      >
        <path
          d="M8 56 L8 22 L36 46 L64 22 L64 56"
          stroke="#FFB627"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8"  cy="22" r="7" fill="#0A0E1A" stroke="#FFB627" strokeWidth="5" />
        <circle cx="64" cy="22" r="7" fill="#0A0E1A" stroke="#FFB627" strokeWidth="5" />
        <circle cx="36" cy="46" r="5.5" fill="#2BB6A4" />
      </svg>
    </div>
  );
}

export async function GET(request: NextRequest) {
  const size = Math.min(
    512,
    Math.max(32, parseInt(request.nextUrl.searchParams.get('size') ?? '192', 10))
  );

  return new ImageResponse(<MakiIcon size={size} />, { width: size, height: size });
}
