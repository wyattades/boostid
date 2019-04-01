import React from 'react';
import { Link } from 'react-router-dom';

import * as api from '../api';


export default class Projects extends React.PureComponent {

  state = {
    projects: null,
    error: null,
  }

  async componentDidMount() {
    const { history, match: { params }, location } = this.props;

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

    const { bucket } = this.props.match.params;

    return (
      <>
        <div className="box">        
          <h1 className="is-size-4">Projects</h1>
          <br/>
          {projects.map((p) => (
            <p key={p}><Link to={`/${bucket}/${p}`}>{p}</Link></p>
          ))}
        </div>
      </>
    );
  }
}
