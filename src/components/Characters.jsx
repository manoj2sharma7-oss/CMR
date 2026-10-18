/** Small SVG characters used on the home screen and result card. */

export function CatFace({ variant = 'orange', className = '' }) {
  const orange = variant === 'orange';
  const fur = orange ? '#ff9d3d' : '#3a3358';
  const inner = orange ? '#ffe0a8' : '#6b5f9a';
  const eye = orange ? '#2a2150' : '#ffe14d';
  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label={orange ? 'Orange cat' : 'Black cat'}>
      <path d="M14 46 L18 10 L44 28 Z" fill={fur} stroke="#2a2150" strokeWidth="4" strokeLinejoin="round" />
      <path d="M86 46 L82 10 L56 28 Z" fill={fur} stroke="#2a2150" strokeWidth="4" strokeLinejoin="round" />
      <path d="M22 36 L24 20 L36 29 Z" fill={inner} />
      <path d="M78 36 L76 20 L64 29 Z" fill={inner} />
      <ellipse cx="50" cy="56" rx="38" ry="34" fill={fur} stroke="#2a2150" strokeWidth="4" />
      {orange && (
        <g stroke="#d9701a" strokeWidth="3" strokeLinecap="round">
          <path d="M42 28 L44 38" />
          <path d="M50 26 L50 38" />
          <path d="M58 28 L56 38" />
        </g>
      )}
      <ellipse cx="36" cy="54" rx="6" ry="9" fill={eye} />
      <ellipse cx="64" cy="54" rx="6" ry="9" fill={eye} />
      <circle cx="38" cy="50" r="2.4" fill={orange ? '#fff' : '#1f1a38'} />
      <circle cx="66" cy="50" r="2.4" fill={orange ? '#fff' : '#1f1a38'} />
      <path d="M45 66 L55 66 L50 72 Z" fill="#ff7eb6" />
      <path d="M50 72 Q44 80 38 74 M50 72 Q56 80 62 74" fill="none" stroke={orange ? '#2a2150' : '#c9c4e0'} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MouseFace({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label="Mouse">
      <circle cx="26" cy="30" r="20" fill="#c9c4e0" stroke="#2a2150" strokeWidth="4" />
      <circle cx="74" cy="30" r="20" fill="#c9c4e0" stroke="#2a2150" strokeWidth="4" />
      <circle cx="26" cy="30" r="10" fill="#ff9fcb" />
      <circle cx="74" cy="30" r="10" fill="#ff9fcb" />
      <ellipse cx="50" cy="58" rx="36" ry="32" fill="#c9c4e0" stroke="#2a2150" strokeWidth="4" />
      <circle cx="37" cy="52" r="5" fill="#2a2150" />
      <circle cx="63" cy="52" r="5" fill="#2a2150" />
      <circle cx="50" cy="68" r="6" fill="#ff5fa2" />
      <path d="M50 74 Q44 80 38 76 M50 74 Q56 80 62 76" fill="none" stroke="#2a2150" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
