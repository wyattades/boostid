import React from 'react';
import { Link } from 'react-router-dom';


export default class ActionTable extends React.PureComponent {

  static defaultProps = {
    actions: [],
  }

  state = {
    checked: [],
    amountChecked: 0,
    actioning: false,
  }

  static getDerivedStateFromProps(props, state) {
    if (props.data.length !== state.checked.length)
      return {
        checked: props.data.map(() => false),
      };
    return null;
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  renderRow = (row, i) => {
    const { columns } = this.props;
    const { checked } = this.state;

    return (
      <tr key={i}>
        <td onMouseDown={this.onMouseDown(i)} onMouseEnter={this.onOver(i)} className="no-select">
          <input type="checkbox" checked={checked[i]} onChange={this.onCheck(i)}/>
        </td>
        {columns.map((column, i) => (
          <td key={column}>{(i === 0 && row._link) ? (<Link to={row._link}>{row[column]}</Link>) : row[column]}</td>
        ))}
      </tr>
    );
  }

  toggleCheck(index, force) {
    this.setState(({ checked }) => {
      
      let amountChecked = 0;

      checked = checked.map((check, i) => {
        const newCheck = index === i ? (typeof force === 'boolean' ? force : !check) : check;
        if (newCheck === true) amountChecked++;
        return newCheck;
      })

      return {
        checked,
        amountChecked,
      };
    });
  }

  onCheck = (index) => () => {
    if (this.dragging !== null)
      this.toggleCheck(index);    
  }

  toggleCheckAll = () => {
    this.setState(({ amountChecked, checked }) => {
      // const newChecked = !allEqual(this.state.checked, true);
      const newChecked = amountChecked !== checked.length;
      return {
        checked: this.state.checked.map(() => newChecked),
        amountChecked: newChecked ? checked.length : 0,
      };
    });
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

  dragging = null;

  onMouseDown = (index) => () => {

    this.dragging = index;
    this.dragSet = !this.state.checked[index];

    this.toggleCheck(index);
  }

  onMouseUp = () => {
    this.dragging = null;
  }

  onOver = (index) => () => {
    if (this.dragging !== null) {
      this.toggleCheck(index, this.dragSet);
      // this.setState({ checked: this.state.checked.map((check, i) => index === i ? true : check) });
    }
  }

  render() {
    const { data, columns, actions } = this.props;
    const { checked, amountChecked, actioning } = this.state;

    if (actioning) return (
      <div>Waiting...</div>
    );

    const allFalse = amountChecked === 0;
    const allTrue = amountChecked === checked.length;

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

        <table className="table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={allTrue} onChange={this.toggleCheckAll}/>
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
