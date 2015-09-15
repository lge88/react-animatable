import React from 'react';

const wrapState = (props, PureComponent) => {
  return React.createClass({
    getInitialState() {
      return props;
    },
    render() {
      return <PureComponent {...this.state} />;
    },
  });
};

export default wrapState;
