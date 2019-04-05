import React from 'react';
import { Link } from 'react-router-dom';

import * as api from '../api';
import ActionTable from '../components/ActionTable';


const COLUMNS = ['id', 'time'];

const ACTIONS = [];

export default class Tests extends React.PureComponent {

  state = {
    tests: null,
    error: null,
  }

  async componentDidMount() {
    this.fetchTests();
  }

  async fetchTests() {
    const params = this.props.match.params;
    const { bucket, project } = params;

    try {
      let tests = await api.getTests(params);
      console.log(tests);
      tests = tests.map(({ id, time }) => ({
        id,
        time,
        _link: `/${bucket}/${project}/${id}`,
      }));

      this.setState({
        tests,
      });
    } catch (error) {
      this.setState({ error });
      // console.error(error);
      // history.push(`/auth?error=${error.code}&from=${encodeURIComponent(location.pathname)}`);
    }
  }

  deleteRows = (rows) => {
    const { bucket, project } = this.props.match.params;

    return api.deleteTests(bucket, project, rows.map((row) => row.id))
    .then(() => this.fetchTests())
    .catch((err) => {
      console.error(err);
      window.alert('Failed to delete objects');
    });
  }

  render() {
    const { error, tests } = this.state;

    if (error) throw error;

    if (!tests) return <p>Loading...</p>;

    return (
      <>
        <div className="box">        
          <h1 className="is-size-4">Tests</h1>
          <br/>
          <ActionTable data={tests} columns={COLUMNS} actions={[{
            name: 'Delete Selected',
            fn: this.deleteRows,
            className: 'is-danger',
          }]}/>
          {/* <ol>
            {tests.map(({ id, time }, i) => (
              <li key={id}><Link to={`/${bucket}/${project}/${id}`}>{id}</Link> ({new Date(time).toLocaleString()})</li>
            ))}
          </ol> */}
        </div>
      </>
    );
  }
}
