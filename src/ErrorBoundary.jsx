import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="fatal-error">
        <h1>Application error</h1>
        <pre>{this.state.error?.stack || this.state.error?.message || String(this.state.error)}</pre>
      </div>
    );
  }
}
