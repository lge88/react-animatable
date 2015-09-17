const { sqrt, cos, sin, exp } = Math;

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
