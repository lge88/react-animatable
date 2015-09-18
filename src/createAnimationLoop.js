export default function createAnimationLoop() {
  // A dictionary of frame function to invoke;
  // key: Unique String, value: a callback () -> Void
  const frameFuncs = {};

  let count = 0;
  let animationId = null;

  function start() {
    function update() {
      Object.keys(frameFuncs).forEach((key) => {
        const frameFunc = frameFuncs[key];
        frameFunc();
      });
      animationId = requestAnimationFrame(update);
    }
    update();
  }

  function stop() {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  return {
    put: (key, frameFunc) => {
      if (typeof frameFuncs[key] === 'undefined') {
        count++;
      }
      frameFuncs[key] = frameFunc;

      if (count > 0 && animationId === null) {
        start();
      }
    },
    del: (key) => {
      if (typeof frameFuncs[key] !== 'undefined') {
        delete frameFuncs[key];
        count--;
      }
      if (count <= 0) {
        stop();
      }
    },
  };
}
