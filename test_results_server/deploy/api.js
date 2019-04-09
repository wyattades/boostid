const express = require('express');

const app = express();


app.use(express.json());

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

app.use('/api/ci', require('./ci'));
// app.use('/api/list-buckets', require('./list-buckets'));

app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.toString(),
  });
});

app.listen(3000);
