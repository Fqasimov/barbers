import { Player } from '@remotion/player';

import { problem } from '../content';
import { Chat, CHAT_FRAMES } from '../remotion/Chat';
import { enter, Kicker, Title } from '../ui';
import type { SlideProps } from './types';

/** 2 · Problem: booking happens in DMs. Facts on the left, the wait in motion on the right. */
export function Problem({ shown }: SlideProps) {
  return (
    <div className="split">
      <div className="split-main">
        <Kicker>{problem.kicker}</Kicker>
        <Title>{problem.title}</Title>
        <div className="facts">
          {problem.points.map((p, i) => (
            <div className="fact" key={p.figure} {...enter(i + 2)}>
              <span className="fact-figure">{p.figure}</span>
              <div>
                <p className="fact-text">{p.text}</p>
                <p className="source">{p.source}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="chat-card" {...enter(3)}>
        <div className="chat-head">
          <span className="chat-avatar">S</span>
          <div>
            <b>Salon</b>
            <span>Instagram DM</span>
          </div>
        </div>
        {shown ? (
          <Player
            component={Chat}
            durationInFrames={CHAT_FRAMES}
            fps={30}
            compositionWidth={560}
            compositionHeight={680}
            style={{ width: 560, height: 680 }}
            controls={false}
            clickToPlay={false}
            autoPlay
            initiallyMuted
            numberOfSharedAudioTags={0}
            doubleClickToFullscreen={false}
            spaceKeyToPlayOrPause={false}
            acknowledgeRemotionLicense
          />
        ) : (
          <div style={{ width: 560, height: 680 }} />
        )}
      </div>
    </div>
  );
}
