// This is not needed after React 0.14
import React from 'react';

export default function makePureComponent(renderFn) {
  return React.createClass({
    render() { return renderFn(this.props); }
  });
}
