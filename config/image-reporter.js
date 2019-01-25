const fs = require('fs');
require('aws-sdk/global');
const S3 = require('aws-sdk/clients/s3');
const config = require('./boostid.config');


class ImageReporter {
  
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;

    if (process.env.AWS_ACCESS_KEY_ID && process.env.UPLOAD_BUCKET) {
      this.s3 = new S3({ apiVersion: '2006-03-01' });
      this.bucket = process.env.UPLOAD_BUCKET;
    }
  }

  onTestResult(test, testResult, aggregateResults) {
    if (this.s3 && testResult.numFailingTests && testResult.failureMessage.match(/different from snapshot/)) {
      const files = fs.readdirSync('./tests/__image_snapshots__/__diff_output__/');
      files.forEach((value) => {
        const path = `${config.name}/${value}`;
        const params = {
          Body: fs.readFileSync(`./tests/__image_snapshots__/__diff_output__/${value}`),
          Bucket: this.bucket,
          Key: path,
          ContentType: 'image/png',
          ACL: 'public-read', 
        };
        this.s3.putObject(params, (err) => {
          if (err) {
            console.log(err, err.stack);
          } else {
            console.log(`Diff file:\nhttps://${this.bucket}.s3.amazonaws.com/${path}`);
          }
        });
      });
    }
  }
}

module.exports = ImageReporter;