import React from 'react';
import CircleChain from './CircleChain';
import withTransition from '../../src/withTransition';

const transitionSpec = {
  property: [
    {
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
          if (!positions[i]) { positions[i] = {}; }
          positions[i][xOrY] = dict[key];
          return positions;
        }, []);
      }
    },
  ],
  transition: { type: 'spring', tension: 120, friction: 20 },
};

const AnimatableCircleChain = withTransition(CircleChain, transitionSpec);

function reducer(oldState, action) {
  if (action.type === 'MOVE_HEAD') {
    const targetPositions = oldState.currentPositions.slice();
    targetPositions.unshift(action.position);
    targetPositions.pop();

    const newState = {
      currentPositions: oldState.currentPositions.slice(),
      targetPositions,
    };
    return newState;
  } else if (action.type === 'UPDATE_CURRENT_POSITIONS') {
    const targetPositions = action.currentPositions.slice();
    targetPositions.unshift(oldState.targetPositions[0]);
    targetPositions.pop();

    const newState = {
      currentPositions: action.currentPositions.slice(),
      targetPositions,
    };
    return newState;
  }

  return oldState;
}

const Demo = React.createClass({
  getInitialState() {
    return {
      currentPositions: Array(...Array(100)).map(() => {
        return { x: 200, y: 200 };
      }),

      targetPositions: Array(...Array(100)).map(() => {
        return { x: 200, y: 200 };
      }),
    };
  },

  componentDidMount() {
    document.addEventListener('mousemove', this._onMouseMove);
  },

  _onMouseMove(e) {
    const { clientX: x, clientY: y } = e;
    const newState = reducer(this.state, {
      type: 'MOVE_HEAD',
      position: { x, y }
    });
    this.setState(newState);
  },

  _onAnimatablePropertyChange(props) {
    const { positions } = props;

    const newState = reducer(this.state, {
      type: 'UPDATE_CURRENT_POSITIONS',
      currentPositions: positions,
    });
    this.setState(newState);
  },

  render() {
    return (
      <AnimatableCircleChain
        positions={this.state.targetPositions}
        onAnimatablePropertyChange={this._onAnimatablePropertyChange}
      />
    );
  }
});

React.render(
  <Demo />,
  document.getElementById('root')
);
