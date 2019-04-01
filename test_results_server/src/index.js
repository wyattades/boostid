import React from 'react';
import * as ReactDOM from 'react-dom';

import './styles/index.scss';
import App from './components/App';
import * as api from './api';


api.init();

ReactDOM.render(<App/>, document.getElementById('root'));
