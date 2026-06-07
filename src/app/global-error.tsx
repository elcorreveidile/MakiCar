'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ background: '#0A0E1A', color: '#F4F1EA', fontFamily: 'sans-serif' }}>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '0 24px',
          textAlign: 'center', gap: '20px',
        }}>
          <span style={{ fontSize: '19px', fontWeight: 800 }}>
            Maki<span style={{ color: '#FFB627' }}>Car</span>
          </span>
          <div style={{ fontSize: '60px' }}>🔧</div>
          <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Avería en el motor</h1>
          <p style={{ color: '#8A93A6', fontSize: '14px', maxWidth: '320px', lineHeight: 1.6 }}>
            Algo grave ha pasado bajo el capó. Ya estamos al tanto — prueba a recargar en un momento.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#FFB627', color: '#0A0E1A', fontWeight: 700,
              borderRadius: '12px', padding: '14px 24px', fontSize: '14px',
              border: 'none', cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
