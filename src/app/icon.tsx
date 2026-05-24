import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        background: '#0A0E1A',
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={24} height={24} viewBox="0 0 72 72" fill="none">
        <path
          d="M8 56 L8 22 L36 46 L64 22 L64 56"
          stroke="#FFB627"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8"  cy="22" r="7" fill="#0A0E1A" stroke="#FFB627" strokeWidth="5" />
        <circle cx="64" cy="22" r="7" fill="#0A0E1A" stroke="#FFB627" strokeWidth="5" />
        <circle cx="36" cy="46" r="5.5" fill="#2BB6A4" />
      </svg>
    </div>,
    { width: 32, height: 32 },
  );
}
