import React from 'react';
import { Link } from 'react-router-dom';

import * as api from '../api';


export default class Tests extends React.PureComponent {

  state = {
    tests: null,
    error: null,
  }

  async componentDidMount() {
    const { location, match: { params }, history } = this.props;

    try {
      const tests = await api.getTests(params);

      this.setState({
        tests,
      });
    } catch (error) {
      this.setState({ error });
      // console.error(error);
      // history.push(`/auth?error=${error.code}&from=${encodeURIComponent(location.pathname)}`);
    }
  }

  render() {
    const { error, tests } = this.state;

    if (error) throw error;

    if (!tests) return <p>Loading...</p>;

    const { bucket, project } = this.props.match.params;

    return (
      <>
        <div className="box">        
          <h1 className="is-size-4">Tests</h1>
          <br/>
          {tests.map(({ id, time }) => (
            <p key={id}><Link to={`/${bucket}/${project}/${id}`}>{new Date(time).toLocaleString()}</Link></p>
          ))}
        </div>
      </>
    );
  }
}
