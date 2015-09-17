import now from 'performance-now';

export default function animationLoop() {
  // animatingState is 2D dictionray
  // animatingState[componentId][propName] -> { startedTime, frameFunc }
  const animatingState = {};

  // renderFuncs is dictionary
  // renderFuncs[componentId] -> renderFunc
  // renderFunc is a callback: () -> Void provide by component used to
  // render the interpolated state.
  const renderFuncs = {};

  let count = 0;
  let animationId = null;

  function start() {
    function loop() {
      // Pull `currentTime' outside the loop might improve the perf (not tested)
      // but less accurate.
      // const currentTime = now();
      Object.keys(animatingState).forEach((componentId) => {
        const componentAnimatingState = animatingState[componentId];
        Object.keys(componentAnimatingState).forEach((propName) => {
          const { startedTime, frameFunc } = componentAnimatingState[propName];
          const currentTime = now();
          frameFunc(currentTime - startedTime);
        });
        const render = renderFuncs[componentId];
        render();
      });

      animationId = requestAnimationFrame(loop);
    }
    loop();
  }

  function stop() {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  return {
    setRenderFuncForComponent: (componentId, render) => {
      renderFuncs[componentId] = render;
    },
    unsetRenderFuncForComponent: (componentId) => {
      delete renderFuncs[componentId];
    },
    put: (componentId, propName, frameFunc) => {
      if (!animatingState[componentId]) {
        animatingState[componentId] = {};
      }

      if (!animatingState[componentId][propName]) {
        count++;
      }

      const startedTime = now();
      animatingState[componentId][propName] = { startedTime, frameFunc };

      if (count > 0 && animationId === null) {
        start();
      }
    },
    del: (componentId, propName) => {
      if (animatingState[componentId] && animatingState[componentId][propName]) {
        delete animatingState[componentId][propName];
        count--;
        if (Object.keys(animatingState[componentId]).length <= 0) {
          delete animatingState[componentId];
        }
      }

      if (count <= 0) {
        stop();
      }
    },
  };
}
