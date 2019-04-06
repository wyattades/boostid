const express = require('express');
const request = require('superagent');
const URL = require('url');


const API_BASE = 'https://circleci.com/api/v1.1';

const app = express.Router();
module.exports = app;


app.get('/results', (req, res) => {
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

app.all('/*', (req, res, next) => {
  const url = `${API_BASE}${req.path}`;

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
