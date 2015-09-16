import React from 'react';
import ReactDom from 'react-dom';
import Circle from './Circle';
import wrapState from '../../src/wrapState';
import makeAnimatable from '../../src/makeAnimatable';

export const AnimatableCircle = makeAnimatable([
  {
    properties: [ 'x', 'y' ],
    spec: { type: 'spring', tension: 120, friction: 14 },
  },
], Circle);

const AnimatableCircleWithState = wrapState({
  x: 0,
  y: 0,
  radius: 50
}, AnimatableCircle);

window.circle = ReactDom.render(
  <AnimatableCircleWithState />,
  document.getElementById('root')
);

document.addEventListener('mousemove', (e) => {
  const { clientX: x, clientY: y } = e;
  circle.setState({ x, y });
});
