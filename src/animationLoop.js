import now from 'performance-now';

export default function animationLoop() {
  // data[componentId][propName] = { startedTime, frameFunc }
  const data = {};
  const renderFuncs = {};
  let count = 0;
  let animationId = null;

  function start() {
    function loop() {
      const time = now();
      Object.keys(data).forEach((componentId) => {
        Object.keys(data[componentId]).forEach((propName) => {
          const { startedTime, frameFunc } = data[componentId][propName];
          frameFunc(time - startedTime);
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
      if (!data[componentId]) {
        data[componentId] = {};
      }
      const startedTime = now();
      data[componentId][propName] = { startedTime, frameFunc };

      count++;
      if (count > 0 && animationId === null) {
        start();
      }
    },
    del: (componentId, propName) => {
      if (data[componentId] && data[componentId][propName]) {
        delete data[componentId][propName];
        if (Object.keys(data[componentId]).length <= 0) {
          delete data[componentId];
        }
        count--;
      }

      if (count <= 0) {
        stop();
      }
    },
  };
}
