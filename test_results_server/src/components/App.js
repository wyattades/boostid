import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
  NavLink,
} from 'react-router-dom';
import { hot } from 'react-hot-loader/root';
// import RouterToUrlQuery from 'react-url-query/lib/react/RouterToUrlQuery';


// Main pages:
import Index from '../pages/index';
import Auth from '../pages/auth';
import Projects from '../pages/projects';
import Results from '../pages/results';
import Tests from '../pages/tests';

import ErrorBoundary from './ErrorBoundary';
import Nav from './Nav';

import * as api from '../api';


// Set default NavLink activeClassName
NavLink.defaultProps.activeClassName = 'is-active';


const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(props) => api.getAuth() ? <Component {...props} /> : (
    <Redirect to={{
      pathname: '/auth',
      search: `?error=Unauthorized&from=${encodeURIComponent(props.location.pathname)}`,
    }} />
  )}/>
);


const App = () => (
  <Router>
    {/* <RouterToUrlQuery> */}
    <>
      <Nav/>
      <section className="section">
        <ErrorBoundary>
          <Switch>
            <PrivateRoute exact path="/" component={Index} />
            <Route exact path="/auth" component={Auth}/>
            <PrivateRoute exact path="/:bucket" component={Projects}/>
            <PrivateRoute exact path="/:bucket/:project" component={Tests}/>
            <PrivateRoute exact path="/:bucket/:project/:test" component={Results}/>
            <Route exact path="/logout" render={() => {
              api.logout();
              return <Redirect to="/" />;
            }} />
            <Route render={() => { throw { code: 404 }; }} />
          </Switch>
        </ErrorBoundary>
      </section>
    </>
    {/* </RouterToUrlQuery> */}
  </Router>
);

// export default App;
export default hot(App);
