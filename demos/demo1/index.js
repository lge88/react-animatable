import React from 'react';
import _CircleChain from './CircleChain';
import withTransition from '../../src/withTransition';

const N = 10;

const CircleChain = withTransition(_CircleChain,  {
  transition: { type: 'spring', tension: 120, friction: 17 },

  property: {
    name: 'positions',
    toDict(propValue) {
      const positions = propValue;
      return positions.reduce((dict, pos, i) => {
        dict[`${i}_x`] = pos.x;
        dict[`${i}_y`] = pos.y;
        return dict;
      }, {});
    },
    fromDict(dict) {
      return Object.keys(dict).reduce((positions, key) => {
        const i = parseInt(key.slice(0, -2), 10);
        const xOrY = key.slice(-1);
        const val = dict[key];

        if (!positions[i]) { positions[i] = {}; }
        positions[i][xOrY] = val;

        return positions;
      }, []);
    }
  },

});

const Demo = React.createClass({
  getInitialState() {
    return {
      positions: Array(...Array(N)).map(() => Object({ x: 300, y: 300 })),
    };
  },

  _onMouseMove(e) {
    const { clientX: x, clientY: y } = e;
    const p0 = this.state.positions[0];
    Object.assign(p0, { x, y });
    this.forceUpdate();
  },

  _onAnimatablePropertyChange(props) {
    const { positions } = props;

    this.state.positions.forEach((pos, i) => {
      if (i === 0) return;
      const newPos = positions[i - 1];
      pos.x = newPos.x;
      pos.y = newPos.y;
    });

    this.forceUpdate();
  },

  render() {
    const style = {
      width: '100vw',
      height: '100vh',
      background: '#eeeeee',
    };

    return (
      <div style={style}
           onMouseMove={this._onMouseMove}>
        <CircleChain
          positions={this.state.positions}
          onAnimatablePropertyChange={this._onAnimatablePropertyChange}
        />
      </div>
    );
  }
});

React.render(
  <Demo />,
  document.getElementById('root')
);
