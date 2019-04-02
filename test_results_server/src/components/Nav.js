import React from 'react';
import { Link, NavLink, withRouter } from 'react-router-dom';

import * as api from '../api';

// To support a fixed header, add this class to document head
// document.documentElement.classList.add('has-navbar-fixed-top');

class Nav extends React.PureComponent {

  state = {
    open: false,
    loggedIn: !!api.getAuth(),
  }

  componentDidUpdate(props) {
    if (this.props.location !== props.location)
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ open: false });
  }

  toggle = () => this.setState(({ open }) => ({ open: !open }))

  signIn = () => api.login()
  .then((path) => this.props.history.push(path))
  .catch(console.error);

  render() {
    const [ bucket, project, test ] = this.props.location.pathname.slice(1).split('/');
    const { open, loggedIn } = this.state;
    const front = this.props.location.pathname === '/';

    // let NavBarEnd = null;
    // if (!loggedIn) {
    //   NavBarEnd = (
    //     <div className="navbar-item">
    //       <button className="button is-outlined is-link is-inverted" onClick={this.signIn}>
    //         Sign In
    //       </button>
    //     </div>
    //   );
    // } else {
    //   NavBarEnd = (
    //     <>
    //       <NavLink className="navbar-item" to="/dashboard">
    //         Dashboard
    //       </NavLink>
    //       <NavLink className="navbar-item" exact to="/listings">
    //         Listings
    //       </NavLink>
    //       <NavLink className="navbar-item" exact to="/listings/new">
    //         Create Listing
    //       </NavLink>
    //       <div className="navbar-item has-dropdown is-hoverable">
    //         <NavLink className="navbar-link" to="/account">
    //           {'Name!'}
    //         </NavLink>
    //         <div className="navbar-dropdown is-right is-boxed">
    //           <Link className="navbar-item" to="/mylistings">
    //             My Listings
    //           </Link>
    //           <hr className="navbar-divider" />
    //           <Link className="navbar-item" to="/account">
    //             Account
    //           </Link>
    //           <hr className="navbar-divider" />
    //           <Link className="navbar-item" to="/logout">
    //             Logout
    //           </Link>
    //         </div>
    //       </div>
    //     </>
    //   );
    // }

    return (
      <nav className={`navbar is-fixed-top is-primary`}>
        <div className="container">
          <div className="navbar-brand">
            <NavLink className="navbar-item has-text-weight-bold is-family-monospace is-size-5" exact to="/" style={{ display: 'block', lineHeight: '100%' }}>
              <span style={{  }}>Boostid</span><br/><span className="is-size-7">Test Results</span>
            </NavLink>
            <div className={`navbar-burger burger ${open ? 'is-active' : ''}`}
              onClick={this.toggle} role="button" tabIndex="0">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className={`navbar-menu ${open ? 'is-active' : ''}`}>
            <div className="navbar-start">
              { bucket && bucket !== 'auth' && (
                <NavLink className="navbar-item" exact to={`/${bucket}`}>
                  Bucket:&nbsp;<strong>{bucket}</strong>
                </NavLink>
              )}
              { project && (
                <NavLink className="navbar-item" exact to={`/${bucket}/${project}`}>
                  Project:&nbsp;<strong>{project}</strong>
                </NavLink>
              )}
              { test && (
                <NavLink className="navbar-item"exact to={`/${bucket}/${project}/${test}`}>
                  Test:&nbsp;<strong>{test}</strong>
                </NavLink>
              )}
            </div>
            <div className="navbar-end">
              <NavLink className="navbar-item" exact to="/auth">
                Authentication
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
    );
  }
}

export default withRouter(Nav);
