import type { CSSProperties, ReactNode } from 'react';

/** A file in public/, wherever the deck is served from. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/** Marks an element to rise in when its slide shows; `i` staggers it. */
export const enter = (i: number) => ({ 'data-in': '', style: { '--i': i } as CSSProperties });

export function Lockup({ size = 40 }: { size?: number }) {
  return (
    <span className="lockup" style={{ fontSize: size }} aria-label="yazılnow" role="img">
      <img src={asset('tools/mark.webp')} alt="" />
      <span aria-hidden>yazılnow</span>
    </span>
  );
}

/** A phone with a real app screen (image) or a screen recording (video). */
export function Phone({
  src,
  video,
  width = 360,
  style,
}: {
  src?: string;
  video?: string;
  width?: number;
  style?: CSSProperties;
}) {
  return (
    <div className="phone" style={{ '--w': `${width}px`, ...style } as CSSProperties}>
      <div className="bezel">
        <div className="screen">
          {video ? (
            <video autoPlay muted loop playsInline>
              {/* WebM first (plays everywhere, including Chromium); MP4 for Safari. */}
              <source src={asset(video.replace(/\.mp4$/, '.webm'))} type="video/webm" />
              <source src={asset(video)} type="video/mp4" />
            </video>
          ) : (
            <img src={asset(src!)} alt="" draggable={false} />
          )}
          <div className="island" />
          <span className="status">9:41</span>
        </div>
      </div>
    </div>
  );
}

export function Kicker({ children, i = 0 }: { children: ReactNode; i?: number }) {
  return (
    <p className="kicker" {...enter(i)}>
      {children}
    </p>
  );
}

export function Title({ children, i = 1, style }: { children: ReactNode; i?: number; style?: CSSProperties }) {
  return (
    <h2 className="title" {...enter(i)} style={{ ...enter(i).style, ...style }}>
      {children}
    </h2>
  );
}
