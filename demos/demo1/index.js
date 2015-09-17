import React from 'react';
import Circle from './Circle';
import wrapState from '../../src/wrapState';
/* import makeAnimatable from '../../src/makeAnimatable'; */
import withTransition from '../../src/withTransition';

export const AnimatableCircle = withTransition(Circle, {
  property: [ 'x', 'y' ],
  transition: { type: 'spring', tension: 120, friction: 14 },
  /* transition: { type: 'easeOutQuad', duration: 100 }, */
});

const AnimatableCircleWithState = wrapState({
  x: 0,
  y: 0,
  radius: 50
}, AnimatableCircle);

window.circle = React.render(
  <AnimatableCircleWithState />,
  document.getElementById('root')
);

document.addEventListener('mousemove', (e) => {
  const { clientX: x, clientY: y } = e;
  circle.setState({ x, y });
});
