import React from 'react';
/* import makeSpringTransition from './makeSpringTransition'; */
import easingFunctions from './easingFunctions';
import animationLoop from './animationLoop';
import uuid from './uuid';
const { abs } = Math;

// The shared raf loop.
const loop = animationLoop();

// Updator :: totalTime: Number -> state: { value: Number, velocity: Number}|Null
//   A generator of interpolated values over time. Null means animation ends.

// cssTransitionUpdator :: delay: Number ->
//   duration: Number ->
//   easingFunction: EasingFunction ->
//   currentValue:Number ->
//   targetValue: Number ->
//   Updator
// EasingFunction :: Number -> Number, function maps value from [0,1] to [0,1].
const cssTransitionUpdator = (
  delay,
  duration,
  easingFunction,
  currentValue,
  targetValue
) => {
  const diff = targetValue - currentValue;
  const updator = (totalTime) => {
    const t = (totalTime - delay) / duration;
    if (t <= 0) return { value: currentValue, velocity: 0.0 };
    if (t >= 1) return null;
    return { value: currentValue + easingFunction(t) * diff, velocity: 0.0 };
  };
  return updator;
};

const createUpdatorMaker = (spec) => {
  const { type, ...otherProps } = spec;

  if (/[sS]pring/.test(type)) {
    const {
      tension,
      friction,
      tolerance = 1 / 1000,
    } = otherProps;

    return (currentValue, currentVelocity, targetValue) => {
      let prevTime = null;
      let prevValue = currentValue;
      let prevVelocity = currentVelocity;
      const diff = targetValue - currentValue;
      const absValueTolerance = abs(diff * tolerance);

      const updator = (totalTime) => {
        if (prevTime === null) {
          // this makes initial timeStep = 1000 / 60 milliseconds
          prevTime = totalTime - 1000 / 60;
        }

        const acceleration = (targetValue - prevValue) * tension
          - friction * prevVelocity;

        // Forward Euler Method:
        // https://en.wikipedia.org/wiki/Euler_methods
        // timeStep are in seconds;
        const timeStep = (totalTime - prevTime) / 1000;
        const newValue = prevValue + timeStep * prevVelocity;
        const newVelocity = prevVelocity + timeStep * acceleration;

        prevTime = totalTime;
        prevValue = newValue;
        prevVelocity = newVelocity;

        if (abs(newValue - targetValue) < absValueTolerance) {
          return null;
        }

        return { value: newValue, velocity: newVelocity };
      };

      return updator;
    };
  } else if (typeof easingFunctions[type] !== 'undefined') {
    const { displacementFn: easingFunction } = easingFunctions[type];
    const { delay = 0, duration = 1000 } = otherProps;
    return (currentValue, currentVelocity, targetValue) => {
      return cssTransitionUpdator(
        delay,
        duration,
        easingFunction,
        currentValue,
        targetValue
      );
    };
  }

  throw new Error(`Unknow transition maker type: ${type}`);
};

// TangentFn :: totalTime: Number ->
//   [displacement: Number, velocity: Number] ->
//   [velocity: Number, acceleration: Number]

// forwardEulerUpdator :: TangentFn -> Updator


// Take a component and a list of transitions.
// Returns an animatable component.
// transitions :: [ Transition ]
// Transition :: {
//  property: [String],
//  transition: CSSTransitionSpec | SpringTransitionSpec,
// }
// CSSTransitionSpec :: {
//   type: 'linear'|'ease'|'easeIn'|'easeOut'|'cubicBezier',
//   delay: Number = 0,
//   duration: Number,
//   p1,p2,p3,p4, (required if type is 'cubicBezier')
// }
// SpringTransitionSpec :: {
//   type: 'spring',
//   tension: Number,
//   friction: Number,
//   tolerance: Number,
// }

const withTransition = (Component, ...transitions) => {
  // propName -> updateMaker dictionary
  const _transitions = transitions.reduce((dict, obj) => {
    const { property, transition } = obj;
    const props = Array.isArray(property) ? property : [property];
    props.forEach((propName) => {
      const updatorMaker = createUpdatorMaker(transition);
      dict[propName] = updatorMaker;
    });
    return dict;
  }, {});

  const getDisplayName = (Component) =>
    Component.displayName || Component.name || 'Component';

  const displayName = getDisplayName(Component);

  return React.createClass({
    displayName: `Animatable(${displayName})`,

    getInitialState() {
      const props = this.props;
      this._componentId = uuid();
      this._animatablePropStates = this._initAnimatablePropStates(props);
      return props;
    },

    componentDidMount() {
      loop.setRenderFuncForComponent(this._componentId, this._renderAnimatingState);
    },

    componentWillReceiveProps(nextProps) {
      const componentId = this._componentId;
      const states = this._animatablePropStates;

      const notAnimatableProps = Object.keys(nextProps).reduce((dict, propName) => {
        if (!(propName in states)) { dict[propName] = nextProps[propName]; }
        return dict;
      }, {});

      // Update animatable props directly.
      this.setState(notAnimatableProps);

      const animatingPropStates = Object.keys(states).reduce((dict, propName) => {
        if (typeof nextProps[propName] === 'undefined') { return dict; }

        const propState = states[propName];
        propState.targetValue = nextProps[propName];

        const { updatorMaker } = propState;
        propState.updator = updatorMaker(
          propState.currentValue,
          propState.currentVelocity,
          propState.targetValue,
        );
        dict[propName] = propState;
        return dict;
      }, {});

      // Put animating props (animatable props that is requested to
      // change) to the shared animation loop. If the prop is already animating,
      // it get updated.
      Object.keys(animatingPropStates).forEach((propName) => {
        const propState = animatingPropStates[propName];
        const { updator } = propState;

        const frameFunc = (totalTime) => {
          // Get updated value:
          const state = updator(totalTime);

          if (state === null) {
            propState.currentVelocity = 0.0;
            propState.currentValue = propState.targetValue;
            loop.del(componentId, propName);
          } else {
            const { value, velocity } = state;
            propState.currentVelocity = velocity;
            propState.currentValue = value;
          }
        };

        loop.put(componentId, propName, frameFunc);
      });
    },

    componentWillUnmount() {
      loop.unsetRenderFuncForComponent(this._componentId);
    },

    _componentId: null,
    _animatablePropStates: null,

    _initAnimatablePropStates(props) {
      return Object.keys(_transitions).reduce(
        (dict, propName) => {
          const updatorMaker = _transitions[propName];
          const propValue = props[propName];
          if (typeof propValue === 'undefined') { return dict; }

          const propState = {
            currentValue: propValue,
            currentVelocity: 0.0,
            targetValue: null,
            // previousValue: null,
            updatorMaker,
          };
          dict[propName] = propState;
          return dict;
        },
        {}
      );
    },

    _renderAnimatingState() {
      const animatablePropStates = this._animatablePropStates;
      const animatingState = Object.keys(animatablePropStates).reduce((dict, propName) => {
        dict[propName] = animatablePropStates[propName].currentValue;
        return dict;
      }, {});
      this.setState(animatingState);
    },

    render() {
      return (
        <Component { ...this.state } />
      );
    },

  });
};

export default withTransition;
