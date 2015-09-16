const { sqrt, cos, sin, abs, exp } = Math;

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
  const vTolerance = tolerance;
  const isGoodEnough = (x, v) => abs(x) < xTolerance && abs(v) < vTolerance;

  let [ t, i, x, v ] = [ startFrom, 0, Infinity, Infinity ];
  while (!isGoodEnough(x, v) && i < maxIter) {
    const tInSeconds = t / 1000;
    [ t, i, x, v ] = [ t + stepSize, i + 1, x_t(tInSeconds), v_t(tInSeconds) ];
  }
  return t;
};

const makeSpringTransition = (props) => {
  const { delay = 0.0, tolerance = 1 / 10000 } = props;
  const { tension, friction } = props;

  const transition = ({
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

    const displacementFn = (t) => targetValue + x_t(t / 1000);
    const velocityFn = (t) => v_t(t / 1000);

    /* const duration = 100; */
    const duration = linearSearchForProperDuration(x0, v0, x_t, v_t, tolerance);
    /* console.log('duration', duration); */

    return { delay, duration, displacementFn, velocityFn };
  };


  return transition;
};

export default makeSpringTransition;
