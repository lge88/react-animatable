import React, { Component, PropTypes } from 'react';

export default class Circle extends Component {
  static propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    radius: PropTypes.number.isRequired,
    color: PropTypes.string,
  };

  shouldComponentUpdate(nextProps) {
    const { x, y, radius, color } = this.props;
    if (nextProps.radius !== radius) return true;
    if (nextProps.color !== color) return true;
    if (Math.abs(nextProps.x - x) > 1) return true;
    if (Math.abs(nextProps.y - y) > 1) return true;
    return false;
  }

  static styles = {
    position: 'absolute',
    display: 'inline-block',
    borderRadius: '50%',
    boxSizing: 'border-box',
    backgroundColor: 'red',
  };

  render() {
    const { x: cx, y: cy, radius: r, color } = this.props;
    const [ d, x, y ] = [ 2 * r, cx - r, cy - r ];

    const _style = {
      ...Circle.styles,
      backgroundColor: color,
      width: d,
      height: d,
      // turns out translate3d is faster than translate
      /* transform: `translate(${x}px, ${y}px)`, */
      transform: `translate3d(${x}px, ${y}px, 0)`,
    };

    return <div style={_style} />;
  }
}
