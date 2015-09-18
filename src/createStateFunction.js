import bezierEasing from 'bezier-easing';
const { abs } = Math;

// StateFunction :: timeSinceStarted(in milliseconds): Number ->
//   state: { value: Number, velocity: Number} | Null(means animation done).

// createCSS3TransitionStateFunction :: startedTime: Number,
//   delay: Number ->
//   duration: Number ->
//   easingFunction: EasingFunction ->
//   currentValue:Number ->
//   targetValue: Number ->
//   StateFunction
// EasingFunction :: Number -> Number, function maps value from [0,1] to [0,1].
function createCSS3TransitionStateFunction({
  delay,
  duration,
  easingFunction,
  currentValue,
  targetValue,
}) {
  const diff = targetValue - currentValue;
  const stateFunction = (timeSinceStarted) => {
    const t = (timeSinceStarted - delay) / duration;
    if (t <= 0) return { value: currentValue, velocity: 0.0 };
    if (t >= 1) return null;
    return {
      value: currentValue + easingFunction(t) * diff,
      // don't care velocity in this mode.
      velocity: 0.0
    };
  };
  return stateFunction;
}

function createSpringStateFunction({
  tension,
  friction,
  tolerance,
  currentValue,
  currentVelocity,
  targetValue,
}) {
  const diff = targetValue - currentValue;
  const absValueTolerance = abs(diff * tolerance);
  const initialTimeStep = 1000 / 60;
  const mass = 1.0;

  let prevTime = null;
  let prevValue = currentValue;
  let prevVelocity = currentVelocity;

  const stateFunction = (timeSinceStarted) => {
    if (prevTime === null) {
      prevTime = timeSinceStarted - initialTimeStep;
    }

    const deform = targetValue - prevValue;
    const force = deform * tension - prevVelocity * friction;
    const acceleration = force / mass;

    // Forward Euler Method:
    // https://en.wikipedia.org/wiki/Euler_methods
    // timeStep are in seconds;
    const timeStep = (timeSinceStarted - prevTime) / 1000;
    const newValue = prevValue + timeStep * prevVelocity;
    const newVelocity = prevVelocity + timeStep * acceleration;

    prevTime = timeSinceStarted;
    prevValue = newValue;
    prevVelocity = newVelocity;

    if (abs(newValue - targetValue) < absValueTolerance) {
      return null;
    }

    return { value: newValue, velocity: newVelocity };
  };

  return stateFunction;
}

export default function createStateFunction({
  type,
  ...otherProps,
}) {
  if (/[sS]pring/.test(type)) {
    const { tension, friction, tolerance } = otherProps;
    const { currentValue, currentVelocity, targetValue } = otherProps;

    return createSpringStateFunction({
      tension,
      friction,
      tolerance,
      currentValue,
      currentVelocity,
      targetValue,
    });
  } else if (/cubicBezier/.test(type)) {
    const { p0, p1, p2, p3 } = otherProps;
    const { delay = 0, duration = 1000 } = otherProps;
    const { currentValue, targetValue } = otherProps;

    const easing = bezierEasing(p0, p1, p2, p3);
    const easingFunction = (t) => easing.get(t);

    return createCSS3TransitionStateFunction({
      delay,
      duration,
      easingFunction,
      currentValue,
      targetValue,
    });
  } else if (typeof bezierEasing[type] !== 'undefined') {
    const { delay = 0, duration = 1000 } = otherProps;
    const { currentValue, targetValue } = otherProps;

    const easing = bezierEasing[type];
    const easingFunction = (t) => easing.get(t);

    return createCSS3TransitionStateFunction({
      delay,
      duration,
      easingFunction,
      currentValue,
      targetValue,
    });
  }

  throw new Error(`Unknow transition type: ${type}`);
}
