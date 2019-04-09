import React from 'react';
import { Link } from 'react-router-dom';

import * as api from '../api';


export default class Projects extends React.PureComponent {

  state = {
    projects: null,
    error: null,
  }

  async componentDidMount() {
    const params = this.props.match.params;

    try {
      const projects = await api.getProjects(params);

      this.setState({
        projects,
      });
    } catch (error) {
      this.setState({ error });
      // console.error(error);
      // history.push(`/auth?error=${error.code}&from=${encodeURIComponent(location.pathname)}`);
    }
  }

  render() {
    const { error, projects } = this.state;

    if (error) throw error;

    if (!projects) return <p>Loading...</p>;

    // const { bucket } = this.props.match.params;

    return (
      <>
        <div className="box">        
          <h1 className="is-size-4">Projects</h1>
          <br/>
          <table className="table">
            <thead>
              <tr>
                <th>Last Test<br/>Status</th>
                <th>Last Test<br/>Time</th>
                <th>Project</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.status && (
                      p.status === 'passing'
                        ? <span className="tag is-success">Passing</span>
                        : <span className="tag is-danger">Failing</span>
                    )}
                  </td>
                  <td>
                    {new Date(p.time).toLocaleString()}
                  </td>
                  <td>
                    <Link to={`/ci/${p.id}`}>{p.label}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
}
