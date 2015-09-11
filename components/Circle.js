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

export const AnimatedCircle = React.createClass({

  getInitialState() {
    return {
      x: 0,
      y: 0,
      radius: 40,
    };
  },

  componentDidMount() {
    const delay = 2000;
    const duration = 2000;
    const [ endX, endY ] = [ 500, 50 ];
    const getMs = () => (new Date()).getTime();
    let started;
    this._animate = () => {
      const t = (getMs() - started) / duration;
      console.log(`t: ${t}`);
      this.setState({ x: endX * t, y: endY * t });
      if (t < 1.0) {
        requestAnimationFrame(this._animate);
      }
    };

    setTimeout(() => {
      started = getMs();
      this._animate();
    }, delay);
  },

  render() {
    return (
      <CircleInRect {...this.state} />
    );
  },

});
