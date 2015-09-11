import React, { Component } from 'react';
import Counter from './Counter';

class App extends Component {
  static propTypes = { initialCount: React.PropTypes.number };
  static defaultProps = { initialCount: 0 };

  state = { count: this.props.initialCount };

  increment = () => { this.setState({ count: this.state.count + 1 }); };

  decrement = () => { this.setState({ count: this.state.count - 1 }); };

  render() {
    return (
      <Counter
        count = { this.state.count }
        increment = { this.increment }
        decrement = { this.decrement }
      />
    );
  }
}

export default App;
