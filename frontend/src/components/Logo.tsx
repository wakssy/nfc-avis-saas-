import type { CSSProperties } from 'react';

function Logo({ style }: { style?: CSSProperties }) {
  return (
    <div className="logo-mark" style={style}>
      av
      <span className="logo-i-wrap">
        ı
        <svg className="logo-star" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8L12 2.5z" />
        </svg>
      </span>
      s<span className="logo-suffix">plaque</span>
    </div>
  );
}

export default Logo;
