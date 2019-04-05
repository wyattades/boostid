import React from 'react';
import { Link } from 'react-router-dom';

import * as api from '../api';


export default class Index extends React.Component {

  state = {
    awsAuth: api.getAuth(),
    ciAuth: api.getAuth('ci'),
    buckets: null,
    ci: null,
    awsError: null,
    ciError: null,
  }

  async componentDidMount() {
    if (this.state.awsAuth) {
      api.getBuckets('aws')
      .then((buckets) => this.setState({ buckets }))
      .catch((awsError) => this.setState({ awsError }));
    }
    if (this.state.ciAuth) {
      api.getBuckets('ci')
      .then((ci) => this.setState({ ci }))
      .catch((ciError) => this.setState({ ciError }));
    }
  }

  render() {
    const { awsAuth, ciAuth, ci, buckets, awsError, ciError } = this.state;

    if (awsError && awsError !== 403) throw awsError;
    if (ciError) throw ciError;

    return (
      <>

        <p>
          There are two ways to view test results: on an AWS S3 bucket or with CircleCI Artifacts.<br/>
          The button at the top right toggles between these two options.
        </p>
        <hr/>
        <br/>

        { awsAuth && (
          <div className="box">
            <h2 className="is-size-4">AWS Buckets</h2>
            <br/>
            {awsError && awsError.status === 403 ? (
              <p>
                Oops! This service account might not have permissions to list S3 buckets.
                Please enter the name of your bucket manually in this pages url e.g. <code>/my-bucket</code>
              </p>
            ) : (
              buckets ? buckets.map((bucket) => (
                <p key={bucket}><Link to={`/${bucket}`}>{bucket}</Link></p>
              )) : (
                <p>Loading...</p>
              )
            )}
          </div>
        )}

        { ciAuth && (
          <div className="box">
            <h2 className="is-size-4">CircleCI Account</h2>
            <br/>
            { ci ? (
              <>
                <p><strong>Name:</strong> {ci.name}</p>
                <p><strong>Username:</strong> {ci.login || '---'}</p>
                <p><strong>Email:</strong> {ci.email}</p>
                <br/>
                <p>View your CircleCI projects here: <Link to="/ci">boostid.now.sh/ci</Link></p>
              </>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        )}
      </>
    );
  }
}
