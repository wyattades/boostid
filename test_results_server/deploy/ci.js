const express = require('express');
const request = require('superagent');
const URL = require('url');


const API_BASE = 'https://circleci.com/api/v1.1';

const app = express();
module.exports = app;

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
    next();
  });
  app.options('*', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
    res.sendStatus(200);
  });
}

app.get('/circleci/results', (req, res) => {
  const url = decodeURIComponent(req.query.url);

  if (!url || !URL.parse(url).hostname)
    res.status(400).json({});
  else
    request.get(url)
    .accept('json')
    .end((err, response) => {
      if (err) {
        res.statusCode = response.status;
        res.status(400).json({});
      } else {
        res.json(response.body);
      }
    });
});

app.all('/circleci/*', (req, res, next) => {
  const url = `${API_BASE}${req.originalUrl.substring(9)}`;

  res.set('Content-Type', 'application/json');

  if (req.method === 'POST') {
    request.post(url)
    .set(req.headers)
    .send(req.body)
    .end((err, response) => {
      if (err) res.statusCode = response.status;
      res.json(response.body);
    });
  
  } else if (req.method === 'GET') {
    request.get(url)
    .set('Authorization', req.headers.authorization)
    .type('json')
    .accept('json')
    .end((err, response) => {
      if (err) res.statusCode = response.status;
      res.json(response.body);
    });
   
  } else {
    next();
  }

});

if (process.env.NODE_ENV === 'development') {
  app.listen(3001, () => {
    console.log('> Listening on https://locahost:3001');
  });
}
