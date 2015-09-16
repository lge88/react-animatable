import React, { cloneElement } from 'react';
import ReactDom from 'react-dom';
import { HCenter, Center, VSpacer, TwoColumn } from './layout';
import { InlineBlock, curry } from 'jsxstyle';
import wrapState from '../../src/wrapState';
import makeAnimatable from '../../src/makeAnimatable';

const Slider = ({
  x = 0,
  y = 0,
  size = 50,
  color = 'rgb(111, 166, 187)',
  cssTransition,
}) => {
  const style = {
    borderRadius: '4px',
    background: color,
    width: size,
    height: size,
    transform: `translate(${x}px, ${y}px)`,
    transition: cssTransition,
  };
  return <InlineBlock {...style} />;
};

const AnimatableSlider = makeAnimatable([{
  properties: [ 'x', 'y' ],
  /* spec: { type: 'easeOutCubic', duration: 500 }, */
  /* spec: { type: 'easeInQuad', duration: 1000 }, */
  /* spec: { type: 'easeInOutQuad', duration: 1000 }, */
  spec: { type: 'spring', tension: 170, friction: 26 },
}], Slider);

const AnimatableSliderCSS3 = (props) => {
  return (<Slider {...props}
                 cssTransition="transform 0.5s ease-out" />);
};

// value is in [0, 1]
const SliderBar = ({
  width,
  height,
  value,
  barColor = 'rgb(236, 237, 226)',
  SliderClass = Slider,
}) => {
  const sliderSize = height;
  const x = value * (width - sliderSize);
  const slider = <SliderClass x={x} y={0} size = {sliderSize} />;

  const style = {
    width: width,
    height: height,
    background: barColor,
    borderRadius: '4px',
  };
  return <InlineBlock {...style}>{slider}</InlineBlock>;
};

const AnimatableSliderBar = curry(SliderBar, {
  SliderClass: AnimatableSlider,
});

const AnimatableSliderBarCSS3 = curry(SliderBar, {
  SliderClass: AnimatableSliderCSS3,
});

const Button = ({ onClick, children }) => {
  const color = 'deepskyblue';
  const style = {
    border: `1px solid ${color}`,
    borderRadius: '2px',
    padding: '5px',
    background: 'none',
    color: color,
    outline: 'none',
    cursor: 'pointer',
  };
  return <button style={style} onClick={onClick}>{children}</button>;
};


const Demo = React.createClass({
  getInitialState() {
    return {
      width: 600,
      flexLeft: 0.25,
      flexRight: 0.75,
      height: 50,
      value: 0.0,
      prevValue: 0.0,
    };
  },

  handleToggle() {
    const { value } = this.state;
    this.setState({ value: 1.0 - value });
  },

  render() {
    const { width, height, flexLeft, flexRight, value, prevValue } = this.state;
    const sliderProps = {
      width: flexRight * width,
      height,
      value,
    };

    const rowProps = { width, flexLeft, flexRight };

    return (
      <HCenter>
        <Button onClick={this.handleToggle}>toggle</Button>

        <VSpacer />
        <TwoColumn {...rowProps}>
          <InlineBlock>No animatation:</InlineBlock>
          <SliderBar {...sliderProps} />
        </TwoColumn>

        <VSpacer />
        <TwoColumn {...rowProps}>
          <InlineBlock>React animatable:</InlineBlock>
          <AnimatableSliderBar {...sliderProps} />
        </TwoColumn>

        <VSpacer />
        <TwoColumn {...rowProps}>
          <InlineBlock>CSS3 Transition</InlineBlock>
          <AnimatableSliderBarCSS3 {...sliderProps} />
        </TwoColumn>

      </HCenter>
    );
  }
});

ReactDom.render(
  <Demo />,
  /* <AnimatableSliderCSS3 />, */
  /* <Slider />, */
  document.getElementById('root')
);
