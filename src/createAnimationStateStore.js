import uuid from './uuid';
import createStateFunction from './createStateFunction';
import now from 'performance-now';

export default function createAnimationStateStore({
  transitions,
  componentProps,
  onChange,
}) {
  const id = uuid();

  // state is dictionary from propName to propState.
  let state = null;

  function initState() {
    return transitions.reduce((dict, spec) => {
      const { property, transition } = spec;
      const props = Array.isArray(property) ? property : [property];

      props.forEach((_prop) => {
        const prop = normalizedProp(_prop);
        const { propName, toDict, fromDict } = prop;
        const propValue = typeof componentProps !== 'undefined' ?
                componentProps[propName] : null;

        const valueDict = toDict(propValue);

        const stateDict = Object.keys(valueDict).reduce((dict, key) => {
          const val = valueDict[key];
          dict[key] = {
            currentValue: val,
            currentVelocity: 0.0,

            targetValue: null,
            stateFunc: null,
            startedTime: null,
          };
          return dict;
        }, {});

        const propState = {
          propName,
          toDict,
          fromDict,
          transition,
          stateDict,
        };

        dict[propName] = propState;
      });

      return dict;
    }, {});
  }

  function defaultToDict(val) { return { value: val }; }

  function defaultFromDict(dict) { return dict.value; }

  function normalizedProp(property) {
    const propName = typeof property === 'string' ? property : property.name;
    const toDict = typeof property.toDict === 'function' ?
            property.toDict : defaultToDict;
    const fromDict = typeof property.fromDict === 'function' ?
            property.fromDict : defaultFromDict;
    return { propName, toDict, fromDict };
  }

  function getCurrentProps() {
    return Object.keys(state).reduce((dict, propName) => {
      const propState = state[propName];
      const { stateDict, fromDict } = propState;
      const valueDict = getCurrentValues(stateDict);
      const currentPropValue = fromDict(valueDict);
      dict[propName] = currentPropValue;
      return dict;
    }, {});
  }

  function getCurrentValues(stateDict) {
    return Object.keys(stateDict).reduce((dict, key) => {
      const state = stateDict[key];
      dict[key] = state.currentValue;
      return dict;
    }, {});
  }

  function setTargetProps(props) {
    Object.keys(props).forEach((propName) => {
      if (typeof state[propName] === 'undefined') {
        return;
      }

      const propState = state[propName];
      const { toDict, stateDict, transition } = propState;
      const targetPropValue = props[propName];

      // should produce a dictionary with same set of keys with stateDict.
      const targetValueDict = toDict(targetPropValue);
      Object.keys(targetValueDict).forEach((key) => {
        const targetValue = targetValueDict[key];
        const state = stateDict[key];
        const { currentValue, currentVelocity } = state;
        const startedTime = now();

        const stateFuncSpec = Object.assign({}, transition, {
          currentValue,
          currentVelocity,
          targetValue,
        });
        const stateFunc = createStateFunction(stateFuncSpec);

        state.targetValue = targetValue;
        state.stateFunc = stateFunc;
        state.startedTime = startedTime;
      });
    });
  }

  function frameUpdate() {
    Object.keys(state).forEach((propName) => {
      const propState = state[propName];
      const { stateDict } = propState;

      Object.keys(stateDict).forEach((key) => {
        const state = stateDict[key];
        const { targetValue, startedTime, stateFunc } = state;
        if (targetValue === null ||
            stateFunc === null ||
            startedTime === null) {
          return;
        }

        const timeSinceStarted = now() - startedTime;
        const newState = stateFunc(timeSinceStarted);

        if (newState === null) {
          // At the end of animation
          Object.assign(state, {
            currentValue: targetValue,
            currentVelocity: 0.0,

            targetValue: null,
            stateFunc: null,
            startedTime: null,
          });
        } else {
          const { value, velocity } = newState;
          Object.assign(state, {
            currentValue: value,
            currentVelocity: velocity,
          });
        }
      });
    });

    onChange();
  }

  function isAnimatable(propName) {
    return typeof state[propName] !== 'undefined';
  }

  state = initState();

  return {
    // queries:
    id() { return id; },
    getCurrentProps,
    isAnimatable,

    // commands:
    // called by animation loop
    frameUpdate,

    // called by component
    setTargetProps,
  };
}
