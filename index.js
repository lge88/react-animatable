import React from 'react';
import ReactDom from 'react-dom';
import { AnimatedCircleWithState } from './components/Circle';

window.app = ReactDom.render(
  <AnimatedCircleWithState />,
  document.getElementById('root')
);

document.addEventListener('click', (e) => {
  const { clientX: x, clientY: y } = e;
  app.setState({ x, y });
});
