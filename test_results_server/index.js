const auth = require('basic-auth');
const URL = require('url');
const querystring = require('querystring');
require('aws-sdk/global');
const S3 = require('aws-sdk/clients/s3');


const s3 = new S3({
  apiVersion: '2006-03-01',
});


const render = (title, content) => `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Test Results</title>
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
  <h1>${title}</h1>
  ${content}
  <script>
  function logout() {
    window.fetch('/', {
      headers: {
        Authorization: 'Basic ' + btoa('invalidate:'),
      },
    })
    .catch(() => location.reload());
  }
  </script>
  <br/><br/><br/>
  <p><button onClick="logout()">Logout</button></p>
</body>
</html>
`;

const renderResults = (bucket, name, testId, results) => {
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
            filename: `https://${bucket}.s3.amazonaws.com/${name}/${testId}/${match[1]}`,
          });
        }
      }
    }
  }

  return `
  <p><strong>Bucket:</strong> <a href="..">${bucket}</a></p>
  <p><strong>Sitename:</strong> <a href=".">${name}</a></p>
  <p><strong>Test ID:</strong> ${testId}</p>
  ${results.timestamp ? `<p><strong>Timestamp:</strong> ${new Date(results.timestamp)}</p>` : ''}
  ${results.ciJob ? `<p><strong>CI Job Number:</strong> ${results.ciJob}</p>` : ''}
  <hr/>
  ${diffFiles.map(({ filename, label }) => `
  <div>
    <p><strong>Test:</strong> ${label}</p>
    <a href="${filename}" target="_blank"><img src="${filename}"/></a>
  </div>`).join('<hr/>')}
  `;
};

const handle = async (req, res) => {

  const credentials = auth(req);

  if (!credentials || !credentials.name || !credentials.pass || credentials.name === 'invalidate') {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="example"');
    res.end('Access Denied. Refresh to try again\n\nUse your AWS access key id and secret access key as the username and password respectively');
    return;
  }

  res.setHeader('Content-Type', 'text/html');

  s3.config.update({
    accessKeyId: credentials.name,
    secretAccessKey: credentials.pass,
  });

  const { pathname, query } = URL.parse(req.url);

  const q = querystring.parse(query);

  const [, Bucket, project, testId] = (pathname || '').split('/');

  if (!Bucket) {
    throw 'Must specify a bucket in the url e.g. /my_bucket_name</p>';
  } else if (!project) {
    await s3.listObjects({
      Bucket,
      Delimiter: '/',
    })
    .promise()
    .then((list) => {

      const content = list.CommonPrefixes.map((dir) => `<p><a href="/${Bucket}/${dir.Prefix.slice(0, -1)}">${dir.Prefix.slice(0, -1)}</a></p>`);

      res.end(render('Projects', content.join('')));
    });
  } else if (!testId) {
    await s3.listObjects({
      Bucket,
      Prefix: `${project}/`,
      Delimiter: '/',
    })
    .promise()
    .then((list) => {

      const content = list.CommonPrefixes.map((dir) => `<p><a href="/${Bucket}/${project}/${dir.Prefix.split('/')[1]}">${dir.Prefix.split('/')[1]}</a></p>`);

      res.end(render(`"${project}" Tests`, content.join('')));
    });
  } else {

    const str = await s3.getObject({
      Bucket,
      Key: `${project}/${testId}/results.json`,
    })
    .promise()
    .then((obj) => obj.Body.toString());

    let json;
    try {
      json = JSON.parse(str);
    } catch (_) {}

    if (json) {
      if (q.json) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(json, null, 2));
      } else
        res.end(render('Visual Regression Results', renderResults(Bucket, project, testId, json)));
    } else
      throw 'Results not found';
  }
};


module.exports = (req, res) => {
  handle(req, res)
  .catch((err) => {
    res.statusCode = 500;
    res.end(render('Error', `<p>${err.toString()}</p>`));
  });
};
