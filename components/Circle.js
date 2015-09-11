import React from 'react';

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

export const CircleInRect = ({ x, y, radius }) => {
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

// Map a function's domain from oldDomain to newDomain
// domain: [ Number, Number ]
function domainMap(oldDomain, newDomain, fn) {
  const oldSpan = oldDomain[1] - oldDomain[0];
  const newSpan = newDomain[1] - newDomain[0];
  if (oldSpan === 0) { return (t) => t; }

  return (t) => {
    const normalizedOldValue = (fn(t) - oldDomain[0]) / oldSpan;
    const newValue = newDomain[0] + normalizedOldValue * newSpan;
    return newValue;
  };
}

// https://en.wikipedia.org/wiki/Damping
// Linear damping model
function springEaseFunctor({
  x0 = -1.0,
  v0 = 0.0,
  mass = 1.0,
  stiffness = 500,
  dampingCoefficient = 20,
}) {
  // Natural frequency
  const w0 = Math.sqrt(stiffness / mass);
  const dampingRatio = 0.5 * dampingCoefficient / Math.sqrt(mass * stiffness);

  let xt;
  if (dampingRatio > 1) {
    // Over-damping
    // gamma^2 + 2*dampingRatio*gamma + w0^2 = 0
    const [ a, b, c ] = [ 1.0, 2.0 * dampingRatio * w0, w0 * w0 ];
    console.assert(b * b - 4 * a * c > 0.0);
    const delta = Math.sqrt(b * b - 4 * a * c);
    const gammaPlus = 0.5 * (-b + delta) / a;
    const gammaMinus = 0.5 * (-b - delta) / a;
    const A = x0 + (gammaPlus * x0 - v0) / (gammaMinus - gammaPlus);
    const B = -(gammaPlus * x0 - v0) / (gammaMinus - gammaPlus);
    xt = (t) => A * Math.exp(gammaPlus * t) + B * Math.exp(gammaMinus * t);
  } else if (dampingRatio === 1) {
    // Critical-damping
    const A = x0;
    const B = v0 + w0 * x0;
    xt = (t) => (A + B * t) * Math.exp(-w0 * t);
  } else {
    // Under-damping
    const wd = w0 * Math.sqrt(1 - dampingRatio * dampingRatio);
    const A = x0;
    const B = (dampingRatio * w0 * x0 + v0) / wd;
    xt = (t) => Math.exp(-dampingRatio * w0 * t) *
      (A * Math.cos(wd * t) + B * Math.sin(wd * t));
  }

  // Map x(t) domain from [x0(initial state), 0.0(final state)] to [0, 1]
  const normalizeDomain = domainMap.bind(null, [ x0, 0.0 ], [ 0.0, 1.0 ]);
  const ease = normalizeDomain(xt);
  return ease;
}

const getMs = () => (new Date()).getTime();

// function animationWrapFunctor(propsSpec) {
//   const animatableProps = Object.keys(propsSpec);

//   return (Component) => {
//     return React.createClass({

//       render() {
//         return (
//           <Component {...this.state} />
//         );
//       },

//     });
//   };
// }

export const AnimatedCircle = React.createClass({

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
    const config = {
      stiffness: 1200,
      dampingCoefficient: 40,
    };

    const [ endX, endY ] = [ 500, 0 ];

    const easeX = springEaseFunctor(Object.assign({
      x0: this.state.x - endX,
    }, config));
    const interpX = domainMap([ 0.0, 1.0 ], [this.state.x, endX], easeX);

    const easeY = springEaseFunctor(Object.assign({
      x0: this.state.y - endY,
    }, config));

    const interpY = domainMap([ 0.0, 1.0 ], [this.state.y, endY], easeY);

    let started;

    const trigger = () => {
      this.setState({ x: 0, y: 0 });
      setTimeout(() => {
        started = getMs();
        this._animate();
      }, delay);
    };

    this._animate = () => {
      const t = (getMs() - started) / duration;
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
      <CircleInRect {...this.state} />
    );
  },

});
