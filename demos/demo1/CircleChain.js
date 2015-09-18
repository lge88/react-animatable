import React from 'react';
import Circle from './Circle';

// Pure component:
const CircleChain = React.createClass({
  propTypes: {
    positions: React.PropTypes.array.isRequired,
  },

  render() {
    const { positions } = this.props;
    const circles = positions.map((pos, i) => {
      return (
        <Circle key={i}
                x={pos.x}
                y={pos.y}
                radius={50}
        />
      );
    });
    return <div>{ circles }</div>;
  }
});

export default CircleChain;
