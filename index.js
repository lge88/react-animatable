import React from 'react';
import ReactDom from 'react-dom';
// import App from './components/App';
import { CircleInRect, AnimatedCircle } from './components/Circle';

ReactDom.render(
  <AnimatedCircle />,
  document.getElementById('root')
);
