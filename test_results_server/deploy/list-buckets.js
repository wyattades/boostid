require('aws-sdk/global');
const S3 = require('aws-sdk/clients/s3');
const express = require('express');


const app = express();
module.exports = app;

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', '*');
    next();
  });
}

app.use(express.json());

app.post('*', (req, res) => {
  const { accessKeyId, secretAccessKey } = req.body;

  if (accessKeyId && secretAccessKey) {

    const s3 = new S3({
      apiVersion: '2006-03-01',
      accessKeyId,
      secretAccessKey,
    });
    s3.listBuckets((err, list) => {
      if (err) {
        res.status(403).json({});
      } else {
        res.json({
          buckets: list.Buckets.map((bucket) => bucket.Name),
        });
      }
    });

  } else {
    res.status(400).json({});
  }
});


if (process.env.NODE_ENV === 'development') {
  app.listen(3000, () => {
    console.log('> Listening on https://locahost:3000');
  });
}
