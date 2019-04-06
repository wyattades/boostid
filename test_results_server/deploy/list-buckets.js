require('aws-sdk/global');
const S3 = require('aws-sdk/clients/s3');
const express = require('express');


const app = express.Router();
module.exports = app;


app.post('/', (req, res) => {
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
