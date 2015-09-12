import React from 'react';
const { sqrt, cos, sin, abs, max } = Math;
const exp = (t) => { return Math.exp(t); };


// Get current milliseconds.
const now = () => (new Date()).getTime();

// Linearly map a function's range from oldRange to newRange
// range: [ Number, Number ]
export const mapRange = (oldRange, newRange, fn) => {
  const oldSpan = oldRange[1] - oldRange[0];
  const newSpan = newRange[1] - newRange[0];
  if (oldSpan === 0) { return (t) => t; }

  return (t) => {
    const normalizedInput = (t - newRange[0]) / newSpan;
    const inputForOldRange = oldRange[0] + normalizedInput * oldSpan;
    return fn(inputForOldRange);
  };
};

// Linearly map a function's domain from oldDomain to newDomain
// domain: [ Number, Number ]
export const mapDomain = (oldDomain, newDomain, fn) => {
  const oldSpan = oldDomain[1] - oldDomain[0];
  const newSpan = newDomain[1] - newDomain[0];
  if (oldSpan === 0) { return (t) => t; }

  return (t) => {
    const normalizedOldValue = (fn(t) - oldDomain[0]) / oldSpan;
    const newValue = newDomain[0] + normalizedOldValue * newSpan;
    return newValue;
  };
};

export const solveQuadraticEquation = ({ a, b, c }) => {
  console.assert(b * b - 4 * a * c >= 0.0);
  const delta = sqrt(b * b - 4 * a * c);
  const rootPlus = 0.5 * (-b + delta) / a;
  const rootMinus = 0.5 * (-b - delta) / a;
  return [ rootPlus, rootMinus ];
};

// https://en.wikipedia.org/wiki/Damping#Example:_mass.E2.80.93spring.E2.80.93damper
// Linear damping model
// Return a object contains:
//   x_t: analytical solution of displacement over time
//   v_t: analytical solution of velocity over time.
//   a_t: analytical solution of acceleration over time. (TODO?)
export const solveMassSpringDamperAnalytical = ({
  initialDisplacement = -1.0,
  initialVelocity = 0.0,
  mass = 1.0,
  stiffness = 1500,
  dampingCoefficient = 40,
}) => {
  const x0 = initialDisplacement;
  const v0 = initialVelocity;
  const [ m, k, c ] = [ mass, stiffness, dampingCoefficient ];
  // Natural frequency
  const w0 = sqrt(k / m);
  /* const T = 2 * Math.PI / w0; */
  // console.log(`T: ${T}`);

  // Damping Ratio
  const zeta = 0.5 * c / sqrt(m * k);

  let x_t;
  let v_t;
  if (zeta > 1) {
    // Over-damping
    // gamma^2 + 2*zeta*gamma + w0^2 = 0
    const [ gammaPlus, gammaMinus ] = solveQuadraticEquation({
      a: 1.0,
      b: 2.0 * zeta * w0,
      c: w0 * w0,
    });
    const A = x0 + (gammaPlus * x0 - v0) / (gammaMinus - gammaPlus);
    const B = -(gammaPlus * x0 - v0) / (gammaMinus - gammaPlus);
    x_t = (t) => A * exp(gammaPlus * t) + B * exp(gammaMinus * t);
    v_t = (t) => A * gammaPlus * exp(gammaPlus * t) +
               B * gammaMinus * exp(gammaMinus * t);
  } else if (zeta === 1) {
    // Critical-damping
    const A = x0;
    const B = v0 + w0 * x0;
    x_t = (t) => (A + B * t) * exp(-w0 * t);
    v_t = (t) => B * exp(-w0 * t) - (A + B * t) * w0 * exp(-w0 * t);
  } else {
    // Under-damping
    const wd = w0 * sqrt(1 - zeta * zeta);
    const A = x0;
    const B = (zeta * w0 * x0 + v0) / wd;
    x_t = (t) => exp(-zeta * w0 * t) * (A * cos(wd * t) + B * sin(wd * t));
    v_t = (t) => {
      const term1 = exp(-zeta * w0 * t) * (-zeta * w0) *
              (A * cos(wd * t) + B * sin(wd * t));
      const term2 = exp(-zeta * w0 * t) *
              (-A * sin(wd * t) * wd + B * cos(wd * t) * wd);
      return term1 + term2;
    };
  }

  return { x_t, v_t };
};

// x0To1_t :: Number -> Number, maps time in seconds to value in [0, 1]
// Returns duration in milliseconds
const searchForProperDuration = (
  x0To1_t,
  tolerance = 1 / 10000,
  stepSize = 1,
  maxIter = 10000,
) => {
  const targetValue = 1.0;
  const linearSearch = () => {
    let t = 0;
    let i = 0;
    let sofar = Infinity;
    while (abs(sofar - targetValue) > tolerance && i < maxIter) {
      const sec = t / 1000;
      sofar = x0To1_t(sec);
      t = t + stepSize;
      i = i + 1;
    }
    return t;
  };
  const duration = linearSearch();
  return duration;
};

const linearSearchForProperDuration = (
  x0,
  v0,
  x_t,
  v_t,
  tolerance = 1 / 10000,
  startFrom = 300,
  stepSize = 1,
  maxIter = 10000,
) => {
  /* return 500; */

  const xTolerance = abs(x0) * tolerance;
  const vTolerance = abs(v0) * tolerance;
  const isGoodEnough = (x, v) => abs(x) < xTolerance && abs(v) < vTolerance;

  let [ t, i, x, v ] = [ startFrom, 0, Infinity, Infinity ];
  while (!isGoodEnough(x, v) && i < maxIter) {
    const tInSeconds = t / 1000;
    [ t, i, x, v ] = [ t + stepSize, i + 1, x_t(tInSeconds), v_t(tInSeconds) ];
  }
  return t;
};

const springResolver = (props) => {
  const { delay = 0.0, tolerance = 1 / 10000 } = props;
  const { tension, friction, initialVelocity } = props;

  const x0 = -1.0;
  const { x_t } = solveMassSpringDamperAnalytical({
    initialDisplacement: x0,
    initialVelocity,
    mass: 1.0,
    stiffness: tension,
    dampingCoefficient: friction,
  });

  // Map x(t) domain from [-1(initial state), 0(final state)] to [0, 1]
  const normalizeDomain = mapDomain.bind(null, [ x0, 0.0 ], [ 0.0, 1.0 ]);
  const x0To1_t = normalizeDomain(x_t);
  const duration = searchForProperDuration(x0To1_t, tolerance);

  // Map x(t) range from [ 0, duration ] to [0, 1]
  const normalizeRange = mapRange.bind(null, [ 0, duration / 1000 ], [ 0.0, 1.0 ]);
  const timingFunction = normalizeRange(x0To1_t);

  const timingFunctor = ({
    targetValue,
    currentValue = 0.0,
    currentVelocity = 0.0,
  }) => {
    // x_t :: time -> [ currentValue - targetValue, 0 ]
    const x0 = currentValue - targetValue;
    const v0 = currentVelocity;
    const { x_t, v_t } = solveMassSpringDamperAnalytical({
      initialDisplacement: x0,
      initialVelocity: v0,
      mass: 1.0,
      stiffness: tension,
      dampingCoefficient: friction,
    });

    const displacementFn = (t) => targetValue + x_t(t);
    const velocityFn = v_t;

    const duration = linearSearchForProperDuration(x0, v0, x_t, v_t, tolerance);

    return { delay, duration, displacementFn, velocityFn };
  };

  return { /* delay, duration, timingFunction , */ timingFunctor };
};

// spec: TransitionSpec -> CSS3TransitionSpec
// TransitionSpec :: {
//   type: String | TransitionSpecResolver,
//   ...otherProps, will be passed in to resolver
// }
// TransitionSpecResolver :: Object -> CSS3TransitionSpec
// CSS3TransitionSpec ::
//   { delay: Number, duration: Number, timingFunction: TimingFunction }
// TimingFunction :: Number -> Number, a easing function maps value
//   from [0, 1] to [0, 1]

const resolveTransitionSpec = (spec) => {
  const { type, ...otherProps } = spec;

  if (/[sS]pring/.test(type)) {
    return springResolver(otherProps);
  }

  if (typeof type === 'function') {
    return type(otherProps);
  }

  // TODO: Warning here;
  return {
    delay: 0.0,
    duration: 0.0,
    timingFunction: (x) => x,
  };
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
const makeAnimatableWrapper = (transitions) => {
  const _transitions = transitions.map((transition) => {
    return {
      properties: [ ...transition.properties ],
      spec: resolveTransitionSpec(transition.spec),
    };
  });

  return (Component) => {
    return React.createClass({

      getInitialState() {
        const props = this.props;
        this._initAnimatablePropSpecs(props);
        this._initAnimatablePropStates(props);
        return null;
      },

      componentWillReceiveProps(nextProps) {

        this._setToInitialAnimationState(nextProps);

        /* const animate = () => {
           this._updateAnimatingPropState();

           this.forceUpdate();
           if (this._countAnimatingProps() > 0) {
           this._animationId = requestAnimationFrame(animate);
           } else {
           this._animationId = null;
           }
           };

           animate(); */
      },

      _animatablePropSpecs: null,
      _initAnimatablePropSpecs(props) {
        this._animatablePropSpecs = _transitions.reduce(
          (dict, transition) => {
            transition.properties.forEach((propName) => {
              const propValue = props[propName];
              if (typeof propValue === 'undefined') { return; }

              const spec = {
                timingFunctor: transition.spec.timingFunctor,
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
              /* console.log('currentValue: ', currentValue, ' targetValue: ', targetValue); */

              Object.assign(state, {
                currentValue,
                currentVelocity,
              });

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
      /* _updateAnimatingPropState() {
         const states = this._animatablePropStates;

         Object.keys(states).forEach((propName) => {
         const state = states[propName];
         if (!state.animating) { return; }

         const { delay, duration, startedTime } = state;
         const t = now() - startedTime - delay;

         // Not delay long enough yet.
         if (t < 0) {
         return;
         } else if (t >= duration) {
         const targetValue = state.targetValue;
         Object.assign(state, {
         currentValue: targetValue,
         currentVelocity: 0.0,

         animating: false,
         startedTime: null,
         delay: null,
         duration: null,
         displacementFn: null,
         velocityFn: null,
         targetValue: null,
         });
         } else {
         const { displacementFn, velocityFn } = state;
         const currentValue = displacementFn(t);
         const currentVelocity = velocityFn(t);

         Object.assign(state, {
         currentValue,
         currentVelocity,
         });
         }
         });
         },

         _countAnimatingProps() {
         const states = this._animatablePropStates;
         const count = Object.keys(states).reduce(
         (sofar, propName) => {
         const state = states[propName];
         return state.animating ? sofar + 1 : sofar;
         }, 0);
         return count;
         },

         _setToFinishedAnimationState(props) {
         const states = this._animatablePropStates;
         Object.keys(states).forEach((propName) => {
         if (typeof props[propName] === 'undefined') { return; }

         const targetValue = props[propName];
         Object.assign(states[propName], {
         animating: false,
         currentValue: targetValue,
         currentVelocity: 0.0,
         });
         });
         }, */

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
};

export const Circle = ({ radius }) => {
  const d = 2 * radius;
  const styles = {
    borderRadius: '50%',
    width: d,
    height: d,
    boxSizing: 'border-box',
    borderWidth: 1,
    borderColor: 'deepskyblue',
    borderStyle: 'solid',
  };

  return (
    <div style={styles} />
  );
};

export const CircleWithPosition = ({ x, y, radius }) => {
  const [ cx, cy ] = [ x - radius, y - radius ];
  const styles = {
    transform: `translate(${cx}px, ${cy}px)`,
  };

  return (
    <div style={styles}>
      <Circle radius={radius} />
    </div>
  );
};

export const AnimatedCircle = makeAnimatableWrapper([
  {
    properties: [ 'x', 'y' ],
    spec: { type: 'spring', tension: 50, friction: 10 },
  },
  /* {
     properties: [ 'x', 'y' ],
     spec: {
     type: (props) => {
     const { delay } = props;
     const timingFunctor = ({
     targetValue,
     currentValue = 0.0,
     currentVelocity = 0.0,
     }) => {
     const diff = targetValue - currentValue;
     const duration = diff;
     const displacementFn = (t) => { return currentValue + diff * t / duration; };
     const velocityFn = () => 0;
     return { duration, delay, displacementFn, velocityFn };
     };
     return { timingFunctor };
     },
     // duration: 100,
     delay: 0,
     },
     }, */
])(CircleWithPosition);

export const makeStateful = (props) => {
  return (Component) => {
    return React.createClass({
      getInitialState() {
        return props;
      },
      render() {
        return <Component {...this.state} />;
      },
    });
  };
};
