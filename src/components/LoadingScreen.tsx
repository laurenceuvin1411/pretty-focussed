export function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column',
    }}>
      <style>{`
        @keyframes ls-fadein {
          from { opacity: 0; transform: translateY(6px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes ls-bar {
          0%   { width: 0% }
          8%   { width: 10% }
          25%  { width: 35% }
          50%  { width: 58% }
          75%  { width: 78% }
          95%  { width: 92% }
          100% { width: 96% }
        }
        @keyframes ls-sub {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
      `}</style>

      {/* Wordmark */}
      <div style={{
        textAlign: 'center',
        animation: 'ls-fadein 600ms cubic-bezier(.16,1,.3,1) forwards',
        marginBottom: 48,
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.45em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.92)',
          fontFamily: 'Syne, system-ui, sans-serif',
          marginBottom: 8,
        }}>
          Laurence
        </p>
        <p style={{
          fontSize: 10,
          fontWeight: 400,
          letterSpacing: '0.30em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.22)',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          animation: 'ls-sub 800ms 200ms ease forwards',
          opacity: 0,
        }}>
          Operating System
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        width: 200,
        height: 1,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 1,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: '#FFFFFF',
          borderRadius: 1,
          animation: 'ls-bar 12s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        }} />
      </div>
    </div>
  )
}
