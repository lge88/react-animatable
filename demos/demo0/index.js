import React from 'react';
import ReactDom from 'react-dom';
import wrapState from '../../src/wrapState';
import makeAnimatable from '../../src/makeAnimatable';

const Slider = ({ size, style }) => {
  const _style = {
    width: size,
    height: size,
    borderRadius: '4px',
    background: 'rgb(111, 166, 187)',
    ...style,
  };

  return (
    <div style={_style}></div>
  );
};

// value is in [0, 1]
const SliderBar = React.createClass({
  render() {
    const { height, width, value, style } = this.props;
    const sliderSize = height;
    const x = value * (width - sliderSize);
    const slider = (
      <Slider size = {sliderSize}
              style = {{ transform: `translate(${x}px, 0px)` }}
      />
    );
    const _style = {
      width: width,
      height: height,
      background: 'rgb(236, 237, 226)',
      ...style,
    };
    return (
      <div style={_style}>
        {slider}
      </div>
    );
  },
});

const ToggleButton = ({onClick}) => {
  return <button onClick={onClick}>Toggle</button>;
};

const AnimatableSliderBar = makeAnimatable([{
  properties: [ 'value' ],
  spec: { type: 'easeOutQuad', duration: 500 },
  /* spec: { type: 'easeInQuad', duration: 1000 }, */
  /* spec: { type: 'easeInOutQuad', duration: 1000 }, */
  /* spec: { type: 'spring', tension: 120, friction: 17 }, */
}], SliderBar);

const Demo = React.createClass({
  getInitialState() {
    return {
      width: 450,
      height: 50,
      value: 0.0,
    };
  },

  handleToggle() {
    this.setState({ value: 1.0 - this.state.value });
  },

  render() {
    return (
      <div>
        <ToggleButton onClick={this.handleToggle} />
        <AnimatableSliderBar {...this.state} />
      </div>
    );
  }
});


window.circle = ReactDom.render(
  <Demo />,
  document.getElementById('root')
);
