import React from 'react';
import Circle from './Circle';
import randomColor from '../randomColor';

const colors = Array(...Array(10)).map(() => randomColor());

// Pure component:
const CircleChain = React.createClass({
  propTypes: {
    positions: React.PropTypes.array.isRequired,
  },

  render() {
    const { positions } = this.props;

    const circles = positions.map((pos, i) => {
      const x = pos.x;
      const y = pos.y;
      return (
        <Circle key={i} x={x} y={y} radius={30} color={colors[i % colors.length]} />
      );
    });
    return <div>{ circles }</div>;
  }
});

export default CircleChain;
