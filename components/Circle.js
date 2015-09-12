import React from 'react';
const { sqrt, exp, cos, sin, abs, max } = Math;

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
//   v_t: analytical solution of velocity over time. (TODO)
//   a_t: analytical solution of acceleration over time. (TODO)
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
  const T = 2*Math.PI/w0;
  console.log(`T: ${T}`);

  // Damping Ratio
  const zeta = 0.5 * c / sqrt(m * k);

  let x_t;
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
  } else if (zeta === 1) {
    // Critical-damping
    const A = x0;
    const B = v0 + w0 * x0;
    x_t = (t) => (A + B * t) * exp(-w0 * t);
  } else {
    // Under-damping
    const wd = w0 * sqrt(1 - zeta * zeta);
    const A = x0;
    const B = (zeta * w0 * x0 + v0) / wd;
    x_t = (t) => exp(-zeta * w0 * t) * (A * cos(wd * t) + B * sin(wd * t));
  }

  return { x_t };
};

// Return a easing function maps value from [0, 1] to [0, 1]
const springEaseFunctor = ({
  tension,
  friction,
  initialVelocity = 0.0,
}) => {
  const x0 = -1.0;
  const { x_t } = solveMassSpringDamperAnalytical({
    initialDisplacement: x0,
    initialVelocity,
    mass: 1.0,
    stiffness: tension,
    dampingCoefficient: friction,
  });
  // Map x(t) domain from [-1.0(initial state), 0.0(final state)] to [0, 1]
  const normalizeDomain = mapDomain.bind(null, [ x0, 0.0 ], [ 0.0, 1.0 ]);
  const ease = normalizeDomain(x_t);
  return ease;
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
  const styles = {
    position: 'relative',
    left: x,
    top: y,
  };

  return (
    <div style={styles}>
      <Circle radius={radius} />
    </div>
  );
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

  return { delay, duration, timingFunction };
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

        const animatableProps = _transitions.reduce(
          (dict, transition) => {
            transition.properties.forEach((propName) => {
              const propValue = props[propName];
              const propState = {
                prevValue: propValue,
                currentValue: propValue,
                nextValue: propValue,
              };
              dict[propName] = propState;
            });
            return dict;
          },
          {}
        );

        return { animatableProps };
      },

      componentWillReceiveProps(nextProps) {
        this._setToInitialAnimationState(nextProps);

        const totalDuration = _transitions.reduce(
          (sofar, transition) => max(sofar, transition.spec.duration),
          -1
        );
        if (totalDuration < 0) return;

        let started;
        this._animate = () => {
          const { animatableProps } = this.state;

          const delta = now() - started;
          if (delta >= totalDuration) {
            this._setToFinishedAnimationState(nextProps);
            return;
          }

          _transitions.forEach((transition) => {
            const { delay, duration } = transition.spec;
            const t = duration === 0 ? -1 : (delta - delay) / duration;
            if (t < 0) { return; }

            const ease = transition.spec.timingFunction;
            transition.properties.forEach((propName) => {
              const { prevValue, nextValue } = animatableProps[propName];
              const diff = nextValue - prevValue;
              const currentValue = prevValue + diff * ease(t);
              animatableProps[propName].currentValue = currentValue;
            });
          });

          this.forceUpdate();
          requestAnimationFrame(this._animate);
        };

        started = now();
        this._animate();
      },

      _setToInitialAnimationState(props) {
        const { animatableProps } = this.state;
        Object.keys(animatableProps).forEach((propName) => {
          animatableProps[propName].prevValue = animatableProps[propName].currentValue;
          animatableProps[propName].nextValue = props[propName];
        });
      },

      _setToFinishedAnimationState(props) {
        const { animatableProps } = this.state;
        Object.keys(animatableProps).forEach((propName) => {
          animatableProps[propName].currentValue = props[propName];
        });
      },

      _resolvedProps() {
        const { animatableProps } = this.state;

        const animatablePropsValueMap = Object.keys(animatableProps).reduce(
          (dict, propName) => {
            dict[propName] = animatableProps[propName].currentValue;
            return dict;
          },
          {}
        );

        const resolvedProps = Object.assign({}, this.props, animatablePropsValueMap);
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

export const AnimatedCircle = makeAnimatableWrapper([
  {
    properties: [ 'x', 'y' ],
    spec: { type: 'spring', tension: 500, friction: 20 },
  },
])(CircleWithPosition);

export const AnimatedCircleWithState = React.createClass({
  getInitialState() {
    return {
      x: 0,
      y: 0,
      radius: 40,
    };
  },

  render() {
    return (<AnimatedCircle {...this.state} />);
  },
});


export const AnimatedCircle_ = React.createClass({

  getInitialState() {
    return {
      x: 0,
      y: 0,
      radius: 40,
    };
  },

  componentDidMount() {
    const delay = 1000;
    const duration = 2000;

    const [ endX, endY ] = [ 500, 0 ];
    const config = { tension: 1200, friction: 40 };
    const easeFn = springEaseFunctor(config);
    const interpX = mapDomain([ 0.0, 1.0 ], [ this.state.x, endX ], easeFn);
    const interpY = mapDomain([ 0.0, 1.0 ], [ this.state.y, endY ], easeFn);

    let started;

    const trigger = () => {
      this.setState({ x: 0, y: 0 });
      setTimeout(() => {
        started = now();
        this._animate();
      }, delay);
    };

    this._animate = () => {
      const t = (now() - started) / duration;
      const [ x, y ] = [ interpX(t), interpY(t) ];
      // console.log(`t: ${t}, x: ${x}, y: ${y}`);
      this.setState({ x, y });
      if (t < 1.0) {
        requestAnimationFrame(this._animate);
      } else {
        trigger();
      }
    };

    trigger();
  },

  render() {
    return (
      <CircleWithPosition {...this.state} />
    );
  },


});
