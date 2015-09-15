import React, { Component, PropTypes } from 'react';

export default class Circle extends Component {
  static propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    radius: PropTypes.number.isRequired,
    style: PropTypes.object,
  };

  static styles = {
    borderWidth: 1,
    borderColor: 'deepskyblue',
    borderStyle: 'solid',
    position: 'absolute',
    display: 'inline-block',
    borderRadius: '50%',
    boxSizing: 'border-box',
  };

  render() {
    const { x: cx, y: cy, radius: r, style } = this.props;
    const [ d, x, y ] = [ 2 * r, cx - r, cy - r ];
    const _style = {
      ...Circle.styles,
      ...style,
      width: d,
      height: d,
      transform: `translate(${x}px, ${y}px)`,
    };

    return (
      <div style={_style} />
    );
  }
}
