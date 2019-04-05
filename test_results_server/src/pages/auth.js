import React from 'react';

import * as api from '../api';
import { decodeQuery } from '../utils';


const parseSubmit = (event) => {
  event.preventDefault();

  const vals = [];
  for (const el of event.target.elements) {
    vals.push(el.value);
    if (el.name) vals[el.name] = el.value;
  }

  return vals;
}

export default class Auth extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      awsAuth: api.getAuth(),
      ciAuth: api.getAuth('ci'),
      error: null,
      from: '/',
    };

    const { from, error } = decodeQuery(props.location.search);
    if (from && from.startsWith('/'))
      this.state.from = from;
    if (error)
      this.state.error = error;
  }

  // goToBucket = (e) => {
  //   const [ val ] = parseSubmit(e);

  //   if (val)
  //     this.props.history.push(`/${val}`);
  // }

  awsLogin = (e) => {
    const [ accessKeyId, secretAccessKey ] = parseSubmit(e);

    api.login({ accessKeyId, secretAccessKey });

    this.setState({ awsAuth: api.getAuth() });
  }

  awsLogout = () => {
    api.logout();

    this.setState({ awsAuth: null });
  }

  ciLogin = (e) => {
    const [ token ] = parseSubmit(e);

    api.login({ token }, 'ci');

    this.setState({ ciAuth: api.getAuth('ci') });
  }

  ciLogout = () => {
    api.logout('ci');

    this.setState({ ciAuth: null });
  }
  
  render() {
    const { awsAuth, ciAuth, error } = this.state;

    return (
      <>

        { error && (
          <p className="notification is-danger">
            { error === 'Unauthorized'
              ? 'You must provide either AWS or CircleCI credentials before you can view Boostid Test Results'
              : `An unexpected error occurred: ${error}. See the console for more details`
            }
          </p>
        )}

        {/* <form onSubmit={this.goToBucket} className="box">
          <label className="label">Enter an AWS S3 bucket name:</label>
          <div className="field has-addons">
          <div className="control">
            <input type="text" className="input" required/>
          </div>
          <div className="control">
            <button type="submit" className="button is-success">Go</button>
          </div>
          </div>
        </form> */}

        <form onSubmit={this.awsLogin} className="box" style={{ position: 'relative' }}>
          <h2 className="is-size-4">AWS Credentials</h2>
          <br/>
          { awsAuth ? (
            <>
              <p className="has-text-grey">Saved credentials with Access Key ID: {awsAuth.accessKeyId}</p>
              <button type="button" className="button is-danger is-outlined" style={{ position: 'absolute', top: 20, right: 20 }}
                onClick={this.awsLogout}>Clear Credentials</button>
            </>
          ) : (
            <>
              <div className="field">
                <label className="label">Access Key ID</label>
                <input type="text" className="input" required/>
              </div>
              <div className="field">
                <label className="label">Secret Access Key</label>
                <input type="password" className="input" required/>
              </div>
              <div className="field">
                <button type="submit" className="button is-success">Save</button>
              </div>
            </>
          )}
        </form>

        <form onSubmit={this.ciLogin} className="box" style={{ position: 'relative' }}>
          <h2 className="is-size-4">CircleCI User Token</h2>
          { ciAuth ? (
            <>
              <p className="has-text-grey">Saved credentials with CI Token: {ciAuth.token}</p>
              <button type="button" className="button is-danger is-outlined" style={{ position: 'absolute', top: 20, right: 20 }}
                onClick={this.ciLogout}>Clear Credentials</button>
            </>
          ) : (
            <>
              <p className="has-text-grey">You can find yours by running <code>boostid config get</code> in your terminal</p>
              <br/>
              <div className="field">
                <label className="label">Token</label>
                <input type="text" className="input" required/>
              </div>
              <div className="field">
                <button type="submit" className="button is-success">Save</button>
              </div>
            </>
          )}
        </form>
      </>
    );
  }
}
