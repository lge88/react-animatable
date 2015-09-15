import React from 'react';
import makeSpringTransition from './makeSpringTransition';
import easingFunctions from './easingFunctions';

// Get current milliseconds.
const now = () => (new Date()).getTime();

// TransitionSpec -> Transition
// TransitionSpec :: {
//   type: String | TransitionMaker
//   ...otherProps, will be passed in to TransitionMaker
// }
// TransitionMaker :: Object -> Transition, a function takes a config
//   object, return a Transition object.
// Transition :: TransitionInitialState -> TransitionDescriptor, a function
//   taks initial state of the transition, returns a descriptor of transition.
// TransitionInitialState ::
// {
//   targetValue: Number, the end value at which this transition is targeting.
//   currentValue: Number,
//   currentVelocity: Number,
// }
// TransitionDescriptor
// {
//   delay: Number, in milliseconds.
//   duration: Number, in milliseconds.
//   propToNumber: Any -> Number,
//     a function maps animatable property to number, default: (x) => x.
//   numberToProp: Any -> Number,
//     a function maps number to animatable property, default: (x) => x.
//   displacementFn: Number -> Number, map time to generalized
//     displacement.
//   velocityFn: Number -> Number, map time to generalized velocity
// }

const createTransition = (spec) => {
  const { type, ...otherProps } = spec;

  if (/[sS]pring/.test(type)) {
    return makeSpringTransition(otherProps);
  } else if (typeof easingFunctions[type] !== 'undefined') {
    const { delay = 0, duration = 1000 } = otherProps;
    const { displacementFn, velocityFn } = easingFunctions[type];
    return ({
      targetValue,
      currentValue = 0.0,
      // currentVelocity = 0.0, not used in this mode.
    }) => {
      return {
        delay: delay,
        duration: duration,
        displacementFn: (t) => {
          return currentValue + (targetValue - currentValue)
            * displacementFn(t / duration);
        },
        velocityFn: (t) => (targetValue - currentValue) / duration * velocityFn(t / duration),
      };
    };
  } else if (typeof type === 'function') {
    const transitionMaker = type;
    return transitionMaker(otherProps);
  }

  throw new Error(`Unknow transition maker type: ${type}`);
};

// Take a list of transitions.
// Returns a functor that wraps a normal component to an animatable
// component.
// transitions :: [ Transition ]
// Transition :: { properties: [String], spec: TransitionSpec }
// TransitionSpec :: {
//   type: String | TransitionSpecResolver,
//   ...otherProps, will be passed in to resolver
// }
const makeAnimatable = (transitions, Component) => {
  const _transitions = transitions.map((transition) => {
    return {
      properties: [ ...transition.properties ],
      spec: createTransition(transition.spec),
    };
  });

  return React.createClass({

    getInitialState() {
      const props = this.props;
      this._initAnimatablePropSpecs(props);
      this._initAnimatablePropStates(props);
      return null;
    },

    componentWillReceiveProps(nextProps) {
      this._setToInitialAnimationState(nextProps);
    },

    _animatablePropSpecs: null,
    _initAnimatablePropSpecs(props) {
      this._animatablePropSpecs = _transitions.reduce(
        (dict, transition) => {
          transition.properties.forEach((propName) => {
            const propValue = props[propName];
            if (typeof propValue === 'undefined') { return; }

            // debugger;
            const spec = {
              timingFunctor: transition.spec,
            };
            dict[propName] = spec;
          });
          return dict;
        },
        {}
      );
    },

    _animatablePropStates: null,
    _initAnimatablePropStates(props) {
      this._animatablePropStates = _transitions.reduce(
        (dict, transition) => {
          transition.properties.forEach((propName) => {
            const propValue = props[propName];
            if (typeof propValue === 'undefined') { return; }

            const propState = {
              currentValue: propValue,
              currentVelocity: 0.0,
              animationId: null,
              targetValue: null,
            };
            dict[propName] = propState;
          });
          return dict;
        },
        {}
      );
    },

    _colllectAnimatableValues() {
      const states = this._animatablePropStates;
      const animatableProps =  Object.keys(states).reduce(
        (dict, propName) => {
          dict[propName] = states[propName].currentValue;
          return dict;
        },
        {}
      );
      return animatableProps;
    },

    _setToInitialAnimationState(props) {
      const specs = this._animatablePropSpecs;
      const states = this._animatablePropStates;

      Object.keys(states).forEach((propName) => {
        if (typeof props[propName] === 'undefined') { return; }

        const timingFunctor = specs[propName].timingFunctor;
        const targetValue = props[propName];
        const state = states[propName];
        const { currentValue, currentVelocity } = state;
        const { delay, duration, displacementFn, velocityFn } = timingFunctor({
          targetValue,
          currentValue,
          currentVelocity,
        });

        if (delay < 0 || duration <= 0) { return; }
        /* console.log('currentValue: ', currentValue, ' targetValue: ', targetValue); */
        /* console.log('currentValue: ', currentValue) */

        const startAnimation = () => {
          if (state.animationId !== null) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
          }

          const startedTime = now();
          const animate = () => {
            const t = now() - startedTime;
            const currentValue = displacementFn(t);
            const currentVelocity = velocityFn(t);
            console.log('t:', t, 'currentValue: ', currentValue, ' targetValue: ', targetValue);

            Object.assign(state, {
              currentValue,
              currentVelocity,
            });

            this.forceUpdate();

            if (t < duration) {
              state.animationId = requestAnimationFrame(animate);
            } else {
              Object.assign(state, {
                currentValue: targetValue,
                currentVelocity: 0.0,
                animationId: null,
              });
            }
          };
          animate();
        };

        setTimeout(startAnimation, delay);
      });
    },

    _resolvedProps() {
      const animatablePropsValues = this._colllectAnimatableValues();
      const resolvedProps = Object.assign({}, this.props, animatablePropsValues);
      return resolvedProps;
    },

    render() {
      return (
        <Component { ...this._resolvedProps() } />
      );
    },

  });
};

export default makeAnimatable;
