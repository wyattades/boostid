import React from 'react';
import { Link } from 'react-router-dom';

import * as api from '../api';


export default class Index extends React.Component {

  state = {
    awsAuth: api.getAuth(),
    buckets: null,
    error: null,
  }

  async componentDidMount() {
    const { history, location } = this.props;
    
    try {
      const buckets = await api.getBuckets();

      this.setState({ buckets });
    } catch (error) {
      this.setState({ error });
      // console.error(error);
      // history.push(`/auth?error=${error.code}&from=${encodeURIComponent(location.pathname)}`);
    }
  }

  render() {
    const { awsAuth, buckets, error } = this.state;

    if (error) throw error;

    return (
      <>

        { awsAuth && (
          <div className="box">
            <h2 className="is-size-4">AWS Buckets</h2>
            <br/>
            { buckets ? buckets.map((bucket) => (
              <p key={bucket}><Link to={`/${bucket}`}>{bucket}</Link></p>
            )) : (
              <p>Loading...</p>
            )}
          </div>
        )}
      </>
    );
  }
}
