import React from 'react';
import { Link } from 'react-router-dom';
import AnsiToHtml from 'ansi-to-html';

import * as api from '../api';


// const ansiToHtml = { toHtml() { return '<p>No</p>'; } };
const ansiToHtml = new AnsiToHtml({
  fg: '#000',
  bg: '#FFF',
});

export default class Results extends React.PureComponent {

  state = {
    json: null,
    diffFiles: null,
    error: null,
  }

  async componentDidMount() {
    const params = this.props.match.params;

    try {
      const { json, diffFiles } = await api.getResults(params);

      this.setState({
        json,
        diffFiles
      });
    } catch (error) {
      this.setState({ error });
      // console.error(error);
      // history.push(`/auth?error=${error.code}&from=${encodeURIComponent(location.pathname)}`);
    }
  }

  render() {
    const { error, json, diffFiles } = this.state;

    if (error) throw error;

    if (!json) return <p>Loading...</p>;

    // const { project, bucket, test } = this.props.match.params;
    const { timestamp, ciUrl, ciJob, testResults } = json;

    return (
      <>
        <h1 className="is-size-3">Test Results: </h1>

        {timestamp ? <p><strong>Timestamp:</strong> {new Date(timestamp).toUTCString()}</p> : null}
        {ciJob ? <p><strong>CI Job:</strong> <a href={ciUrl}>{ciJob}</a></p> : null}
        <hr/>
        <h2 className="is-size-4">Test File Results:</h2>
        <br/>
        {testResults.testResults.map(({ name, message }) => (
          <div key={name}>
            <p style={{ marginBottom: 8 }} className={message ? 'has-text-danger' : 'has-text-success'}>{name}</p>
            {message ? <pre dangerouslySetInnerHTML={{ __html: ansiToHtml.toHtml(message) }}/> : null}
            <br/>
          </div>
        ))}
        <hr/>
        <h2 className="is-size-4">Visual Regression Mismatches:</h2>
        <p>{diffFiles.length} Mismatches</p>
        <br/>
        {diffFiles.map(({ filename, label }) => (
          <div key={filename}>
            <p style={{ marginBottom: 8 }}>
              <strong>Test:</strong> <span className="test-arrow-labels">{label.map((l) => <span key={l}>{l}</span>)}</span>
            </p>
            <a href={filename} target="_blank">
              <img className="diff-image" src={filename}/>
            </a>
          </div>
        ))}
      </>
    );
  }
}
