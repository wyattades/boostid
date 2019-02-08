const fs = require('fs-extra');
const logger = require('../lib/log');


class ImageReporter {
  
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;

    if (process.env.AWS_ACCESS_KEY_ID && process.env.VISUALREG_BUCKET) {
      logger.info('Setting up AWS S3 for visual regression image hosting...');

      require('aws-sdk/global');
      const S3 = require('aws-sdk/clients/s3');

      this.s3 = new S3({ apiVersion: '2006-03-01' });
      this.bucket = process.env.VISUALREG_BUCKET;
      this.name = process.env.PANTHEON_SITE_NAME;
      try {
        this.containerId = fs.readFileSync('/etc/hostname', 'utf8').trim();
      } catch (_) {
        this.containerId = Math.floor(Math.random() * 1000000000).toString();
      }
    }
  }

  visualRegHtml(files) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Visualreg: ${this.name}/${this.containerId}</title>
  <style>
    html {
      font-family: Verdana, Geneva, sans-serif;
    }
    img {
      width: 100%;
      border: 2px solid black;
    }
  </style>
</head>
<body>
  <h1>Visual Regression Results</h1>
  <p><strong>Sitename:</strong> ${this.name}</p>
  <p><strong>Container ID:</strong> ${this.containerId}</p>
  <hr/>
  ${files.map(({ filename, label }) => `
  <div>
    <p><strong>Test:</strong> ${label}</p>
    <a href="./${filename}" target="_blank"><img src="./${filename}"/></a>
  </div>`).join('<hr/>')}
</body>
</html>
`;
  }

  putFile(filename, ContentType, contents) {
    return new Promise((resolve, reject) => {
      this.s3.putObject({
        Body: contents,
        Bucket: this.bucket,
        Key: `${this.name}/${this.containerId}/${filename}`,
        ContentType,
        ACL: 'public-read',
      }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  onRunComplete(contexts, results) {
    if (!this.s3) return;

    const diffFiles = [];
    // for each file
    for (const { testResults } of results.testResults) {
      // for each test in that file
      for (const testResult of testResults) {
        if (testResult.failureMessages && testResult.failureMessages.length) {
          const match = testResult.failureMessages[0].match(/__diff_output__\/([^\s]+-diff\.png)/);
          if (match) {
            diffFiles.push({
              label: testResult.ancestorTitles.concat([testResult.title]).join(' <strong>»</strong> '),
              filename: match[1],
            });
          }
        }
      }
    }
    
    if (diffFiles.length) {
      
      let resultsJson;
      try {
        resultsJson = JSON.stringify({
          version: 1,
          diffFiles,
          testResults: results.testResults,
        });
      } catch (err) {
        console.error(err);
      }
      if (!resultsJson) resultsJson = '{}';
      
      Promise.all(diffFiles.map(({ filename }) => (
        this.putFile(filename, 'image/png', fs.readFileSync(`./__tests__/__image_snapshots__/__diff_output__/${filename}`))
      )).concat([
        this.putFile('index.html', 'text/html', this.visualRegHtml(diffFiles)),
        this.putFile('results.json', 'application/json', resultsJson),
      ]))
      .then(() => {
        console.log();
        const url = `https://${this.bucket}.s3.amazonaws.com/${this.name}/${this.containerId}/index.html`;
        fs.outputFileSync('/tmp/boostid_test_results', url);

        logger.info('View the visual regression results at:');
        logger.info(url);
      });
    }
  }
}

module.exports = ImageReporter;
