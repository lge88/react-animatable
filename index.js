import React from 'react';
import ReactDom from 'react-dom';
import { AnimatedCircle, makeStateful } from './components/Circle';

const wrapFn = makeStateful({ x: 0, y: 0, radius: 50 });
const AnimatedCircleWithState = wrapFn(AnimatedCircle);

window.circle = ReactDom.render(
  <AnimatedCircleWithState />,
  document.getElementById('root')
);

document.addEventListener('mousemove', (e) => {
  const { clientX: x, clientY: y } = e;
  const state = { x, y };
  circle.setState(state);
});
