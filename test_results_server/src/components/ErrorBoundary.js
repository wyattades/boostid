import React from 'react';
import { withRouter, Link } from 'react-router-dom';

import { decodeQuery } from '../utils';


const getMessage = (code) => {
  console.log(code);
  switch (code) {
    case 'NetworkError':
    case 'NetworkingError':
    return ['🌐', 'Network Error'];
    case 401:
    case 403: return [403, 'You don\'t have access to this content!'];
    case 404: return [404, 'Oops, nothing here!'];
    default: return [500, 'Something unexpected occurred... Please try again'];
  }
};

class ErrorBoundary extends React.Component {

  state = {
    code: 0,
    message: '',
    hasError: false,
  }

  // componentDidUpdate(prevProps) {
  //   if (prevProps.location !== this.props.location) {
  //     const { error, from } = decodeQuery(this.props.location.search);
  //     if (error)
  //       this.setError(error);
  //   }
  // }

  componentDidCatch(error) {
    let message,
        code;
    
    if (typeof error === 'string') message = error;
    else {
      if (error && error.code) code = error.code;
      else if (error && error.status) code = error.status;
    }

    this.setError(code, message);
  }

  setError = (code, message) => {

    if (!message)
      [code, message] = getMessage(code);

    this.setState({
      hasError: true,
      code,
      message,
    });

    const unlisten = this.props.history.listen(() => {
      this.setState({ hasError: false });
      unlisten();
    });
  }

  // goBack = () => {
  //   // TODO: Somehow check if error is a result of navigating
  //   // this.props.history.goBack();
  //   this.props.history.push('/');

  //   this.setState({
  //     hasError: false,
  //   });
  // }

  render() {
    const { hasError, code, message } = this.state;

    return !hasError ? this.props.children : (
      <section className="hero is-fullheight-flex">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="is-size-1">{code}</h1>
            <h3 className="is-size-4">{message}</h3>
            <p className="has-text-grey">See the console for more details</p>
            <br/>
            <Link className="button is-medium is-primary"
              to="/">Go Back
            </Link>
          </div>
        </div>
      </section>
    );
  }
}

export default withRouter(ErrorBoundary);
