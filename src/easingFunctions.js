// https://gist.github.com/gre/1650294
/*
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 */

const easingFunctions = {
  // no easing, no acceleration
  linear: {
    displacementFn: (t) => t,
    velocityFn: () => 1,
  },
  // accelerating from zero velocity
  easeInQuad: {
    displacementFn: (t) => t * t,
    velocityFn: (t) => 2 * t,
  },
  // decelerating to zero velocity
  easeOutQuad: {
    displacementFn: (t) => t * (2 - t),
    velocityFn: (t) => 2 - 2 * t,
  },
  // acceleration until halfway, then deceleration
  easeInOutQuad: {
    displacementFn: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    velocityFn: (t) => t < 0.5 ? 4 * t : 4 - 4 * t,
  },
  // accelerating from zero velocity
  easeInCubic: {
    displacementFn: (t) => t * t * t,
    velocityFn: (t) => 3 * t * t,
  },
  // decelerating to zero velocity
  easeOutCubic: {
    displacementFn: (t) => (t - 1) * (t - 1) * (t - 1) + 1,
    velocityFn: (t) => 3 * (t - 1) * (t - 1),
  },
  // acceleration until halfway, then deceleration
  easeInOutCubic: {
    displacementFn: (t) => t < 0.5 ? 4 * t * t * t :
                         (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    velocityFn: (t) => t < 0.5 ? 12 * t * t : 12 * (1 - t) * (1 - t),
  },
  // accelerating from zero velocity
  easeInQuart: {
    displacementFn: (t) => t * t * t * t,
    velocityFn: (t) => 4 * t * t * t,
  },
  // decelerating to zero velocity
  easeOutQuart: {
    displacementFn: (t) => 1 - (t - 1) * (t - 1) * (t - 1) * (t - 1),
    velocityFn: (t) => -4 * (t - 1) * (t - 1) * (t - 1),
  },
  // acceleration until halfway, then deceleration
  easeInOutQuart: {
    displacementFn: (t) => t < 0.5 ? 8 * t * t * t * t :
                         1 - 8 * (t - 1) * (t - 1) * (t - 1) * (t - 1),
    velocityFn: (t) => t < 0.5 ? 32 * t * t * t :
                    -32 * (t - 1) * (t - 1) * (t - 1),
  },
  // accelerating from zero velocity
  easeInQuint: {
    displacementFn: (t) => t * t * t * t * t,
    velocityFn: (t) => 5 * t * t * t * t,
  },
  // decelerating to zero velocity
  easeOutQuint: {
    displacementFn: (t) => 1 + (t - 1) * (t - 1) * (t - 1) * (t - 1) * (t - 1),
    velocityFn: (t) => 5 * (t - 1) * (t - 1) * (t - 1) * (t - 1),
  },
  // acceleration until halfway, then deceleration
  easeInOutQuint: {
    displacementFn: (t) => t < 0.5 ? 16 * (t - 1) * (t - 1) * (t - 1) * (t - 1) * (t - 1) :
                         1 + 16 * (t - 1) * (t - 1) * (t - 1) * (t - 1) * (t - 1),
    velocityFn: (t) => t < 0.5 ? 80 * (t - 1) * (t - 1) * (t - 1) * (t - 1) :
                     80 * (1 - t) * (1 - t) * (1 - t) * (1 - t),
  },
};

export default easingFunctions;
