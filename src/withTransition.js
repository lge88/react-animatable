import React from 'react';
import makeSpringTransition from './makeSpringTransition';
import easingFunctions from './easingFunctions';
import animationLoop from './animationLoop';

// The shared raf loop.
const loop = animationLoop();

const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// A generator of values
// Updator :: totalTime: Number -> value: Number|Null

// cssTransitionUpdator :: CurrentValue:Number ->
//   TargetValue: Number ->
//   TimingFunction -> Updator
// TimingFunction :: Function, easing function maps value from [0,1] to [0,1].
const cssTransitionUpdator = (delay, duration, easingFunction, currentValue, targetValue) => {
  const diff = targetValue - currentValue;
  const updator = (totalTime) => {
    const t = (totalTime - delay) / duration;
    if (t <= 0) return currentValue;
    if (t >= 1) return null;
    return currentValue + easingFunction(t) * diff;
  };
  return updator;
};

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

const createUpdatorMaker = (spec) => {
  const { type, ...otherProps } = spec;

  if (/[sS]pring/.test(type)) {
    throw new Error(`Unknow transition maker type: ${type}`);
    // return makeSpringTransition(otherProps);
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
      this._initAnimatablePropStates(props);
      return props;
    },

    componentDidMount() {
      loop.setRenderFuncForComponent(this._componentId, this._renderAnimatingState);
    },

    componentWillReceiveProps(nextProps) {
      const states = this._animatablePropStates;
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

      const componentId = this._componentId;

      Object.keys(animatingPropStates).forEach((propName) => {
        const propState = animatingPropStates[propName];
        const { updator } = propState;

        const frameFunc = (totalTime) => {
          // Get updated value:
          const value = updator(totalTime);

          if (value === null) {
            propState.currentValue = propState.targetValue;
            loop.del(componentId, propName);
          } else {
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
      this._animatablePropStates = Object.keys(_transitions).reduce(
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
