import type { ComponentType } from 'react';

export type SlideProps = {
  /** True once the slide is on screen (entrances and motion start then). */
  shown: boolean;
  next: () => void;
};

export type Slide = { Component: ComponentType<SlideProps>; chrome?: boolean };
