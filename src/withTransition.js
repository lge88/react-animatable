import React, { PropTypes } from 'react';
import createAnimationLoop from './createAnimationLoop';
import createAnimationStateStore from './createAnimationStateStore';

// The shared raf loop.
const loop = createAnimationLoop();

const withTransition = (Component, ...transitions) => {
  const getDisplayName = (Component) =>
    Component.displayName || Component.name || 'Component';

  const displayName = getDisplayName(Component);

  return React.createClass({
    displayName: `Animatable(${displayName})`,

    propTypes: {
      onAnimatablePropertyChange: PropTypes.func
    },

    getDefaultProps() {
      return {
        onAnimatablePropertyChange: () => {}
      };
    },

    getInitialState() {
      const props = this.props;
      this._animationStateStore = createAnimationStateStore({
        transitions,
        componentProps: props,
        onChange: this._onAnimationStateChange,
      });
      return props;
    },

    componentDidMount() {
      const animationStateStore = this._animationStateStore;
      const key = animationStateStore.id();
      const frameFunc = animationStateStore.frameUpdate;
      loop.put(key, frameFunc);
    },

    componentWillReceiveProps(nextProps) {
      const animationStateStore = this._animationStateStore;
      const isAnimatable = animationStateStore.isAnimatable;

      const notAnimatableProps = Object.keys(nextProps).reduce((dict, propName) => {
        if (!isAnimatable(propName)) { dict[propName] = nextProps[propName]; }
        return dict;
      }, {});

      // Update not animatable props directly.
      this.setState(notAnimatableProps);

      animationStateStore.setTargetProps(nextProps);
    },

    componentWillUnmount() {
      const animationStateStore = this._animationStateStore;
      const key = animationStateStore.id();
      loop.del(key);
    },

    _animationStateStore: null,

    _onAnimationStateChange() {
      const animatingProps = this._animationStateStore.getCurrentProps();
      this.setState(animatingProps);

      // Report transition state.
      const onAnimatablePropertyChange = this.props.onAnimatablePropertyChange;
      if (typeof onAnimatablePropertyChange === 'function') {
        onAnimatablePropertyChange(animatingProps);
      }
    },

    render() {
      return (
        <Component { ...this.state } />
      );
    },

  });
};

export default withTransition;
