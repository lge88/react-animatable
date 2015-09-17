import React from 'react';
import { InlineBlock, Block, curry } from 'jsxstyle';
import { HCenter, TwoColumn } from '../layout';
import makePureComponent from '../makePureComponent';

import withTransition from '../../src/withTransition';

const Slider = makePureComponent(
  ({
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
  }
);

const AnimatableSlider = withTransition(Slider, {
  property: [ 'x', 'y' ],
  transition: { type: 'linear', duration: 500 },
  /* transition: { type: 'easeOutQuint', duration: 500 }, */
  /* transition: { type: 'cubicBezier', p1: 0.1, p2: 0.3, p3: 0.4, p4: 0.7, duration: 500 }, */
  /* transition: { type: 'easeInQuad', duration: 500 }, */
  /* transition: { type: 'easeInOutQuad', duration: 500 }, */
  /* transition: { type: 'spring', tension: 170, friction: 26 }, */
});

const AnimatableSliderCSS3 = makePureComponent(
  (props) => {
    return (
      <Slider {...props}
              cssTransition="transform 0.5s linear"
      />
    );
  }
);

// value is in [0, 1]
let SliderBar = ({
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
SliderBar = makePureComponent(SliderBar);

const AnimatableSliderBar = curry(SliderBar, {
  SliderClass: AnimatableSlider,
});

const AnimatableSliderBarCSS3 = curry(SliderBar, {
  SliderClass: AnimatableSliderCSS3,
});

let Button = ({ onClick, children }) => {
  const color = 'deepskyblue';
  const style = {
    border: `1px solid ${color}`,
    borderRadius: '2px',
    padding: '0.2em 0.8em',
    background: 'none',
    color: color,
    outline: 'none',
    cursor: 'pointer',
    fontSize: 'xx-large',
  };
  return <button style={style} onClick={onClick}>{children}</button>;
};
Button = makePureComponent(Button);

const VSpacer = curry(Block, {
  marginBottom: '15px'
});

const Demo = React.createClass({
  getInitialState() {
    return {
      width: 0.95 * window.innerWidth,
      flexLeft: 0.25,
      flexRight: 0.75,
      height: 50,
      value: 0.0,
    };
  },

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },

  handleResize() {
    this.setState({ width: 0.95 * window.innerWidth });
  },

  handleToggle() {
    const { value } = this.state;
    this.setState({ value: 1.0 - value });
  },

  render() {
    const { width, height, flexLeft, flexRight, value } = this.state;
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

React.render(
  <Demo />,
  document.getElementById('root')
);
