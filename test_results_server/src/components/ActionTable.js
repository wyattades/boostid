import React from 'react';
import { Link } from 'react-router-dom';


const allEqual = (array, val) => {
  for (const el of array)
    if (el !== val) return false;
  return true;
};

export default class ActionTable extends React.PureComponent {

  static defaultProps = {
    actions: [],
  }

  state = {
    checked: [],
    actioning: false,
  }

  static getDerivedStateFromProps(props, state) {
    if (props.data.length !== state.checked.length)
      return {
        checked: props.data.map(() => false)
      };
    return null;
  }

  renderRow = (row, i) => {
    const { columns } = this.props;
    const { checked } = this.state;

    return (
      <tr key={i}>
        <td onMouseEnter={this.onOver(i)}>
          <input type="checkbox" checked={checked[i]} onChange={this.toggleCheck(i)}/>
        </td>
        {columns.map((column, i) => (
          <td key={column}>{(i === 0 && row._link) ? (<Link to={row._link}>{row[column]}</Link>) : row[column]}</td>
        ))}
      </tr>
    );
  }

  toggleCheck = (index) => () => {
    this.setState({ checked: this.state.checked.map((check, i) => index === i ? !check : check) });
  }

  toggleCheckAll = () => {
    const val = !allEqual(this.state.checked, true);

    this.setState({ checked: this.state.checked.map(() => val)  });
  }

  handleAction = (action) => () => {
    const { checked } = this.state;

    this.setState({
      actioning: true
    }, () => {
      const pr = action.fn(this.props.data.filter((_, i) => checked[i]));
      if (typeof pr.then === 'function') pr.then(() => this.setState({ actioning: false }));
      else this.setState({ actioning: false });
    })
  }

  dragging = false;

  onMouseDown = () => {
    this.dragging = true;
  }

  onMouseUp = () => {
    this.dragging = false;
  }

  onOver = (index) => () => {
    if (this.dragging) {
      this.setState({ checked: this.state.checked.map((check, i) => index === i ? true : check) });
    }
  }

  render() {
    const { data, columns, actions } = this.props;
    const { checked, actioning } = this.state;

    if (actioning) return (
      <div>Waiting...</div>
    );

    const allFalse = allEqual(checked, false);

    return (
      <>

        {actions.length ? (
          <div className="buttons">
            {actions.map((action) => (
              <button className={`button ${action.className || ''}`} onClick={this.handleAction(action)} key={action.name} disabled={allFalse}>
                {action.name}
              </button>
            ))}
          </div>
        ) : null}

        <table className="table" onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp}>
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={allEqual(checked, true)} onChange={this.toggleCheckAll}/>
              </th>
              {columns.map((column) => (
                <th className="is-capitalized" key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(this.renderRow)}
          </tbody>
        </table>
      </>
    );
  }
}
