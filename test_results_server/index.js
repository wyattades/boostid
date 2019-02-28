const auth = require('basic-auth');
const URL = require('url');
const querystring = require('querystring');
const AnsiToHtml = require('ansi-to-html');
require('aws-sdk/global');
const S3 = require('aws-sdk/clients/s3');


const ansiToHtml = new AnsiToHtml({
  fg: '#000',
  bg: '#FFF',
});

const s3 = new S3({
  apiVersion: '2006-03-01',
});


const render = (title, content) => `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${title}</title>
  <style>
    html {
      font-family: Verdana, Geneva, sans-serif;
    }
    body {
      padding: 0;
      margin: 16px;
    }
    img {
      width: 100%;
      border: 2px solid black;
    }
    pre {
      margin: 0;
      padding: 20px;
      background: #eee;
      white-space: pre-wrap;
    }
    .error {
      color: #e03121;
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

const renderResults = (bucket, name, testId, { testResults, timestamp, ciJob, ciUrl = '' }) => {
  const diffFiles = [];

  // for each file
  for (const { assertionResults } of testResults.testResults) {

    // for each test in that file
    for (const assertResult of assertionResults) {
      if (assertResult.failureMessages && assertResult.failureMessages.length) {
        const match = assertResult.failureMessages[0].match(/([^\s/]+?-diff\.png)/);
        if (match) {
          diffFiles.push({
            label: assertResult.ancestorTitles.concat([ assertResult.title ]),
            filename: `https://${bucket}.s3.amazonaws.com/${name}/${testId}/${encodeURIComponent(match[1])}`,
          });
        }
      }
    }
  }

  return `
<p><strong>Bucket:</strong> <a href="/${bucket}">${bucket}</a></p>
<p><strong>Project:</strong> <a href="/${bucket}/${name}">${name}</a></p>
<p><strong>Test ID:</strong> ${testId}</p>
${timestamp ? `<p><strong>Timestamp:</strong> ${new Date(timestamp).toUTCString()}</p>` : ''}
${ciJob ? `<p><strong>CI Job:</strong> <a href="${ciUrl}">${ciJob}</a></p>` : ''}
<hr/>
<h2>Test Results</h2>
${testResults.testResults.map(({ name, message }) => `
  <p>${name}</p>
  <pre>${ansiToHtml.toHtml(message || '')}</pre>`)}
<h2>Visual Regression Mismatches</h2>
<p>${diffFiles.length} Mismatches</p>
${diffFiles.map(({ filename, label }) => `
<div>
  <p><strong>Test:</strong> ${label.join(' <strong>»</strong> ')}</p>
  <a href="${filename}" target="_blank"><img src="${filename}"/></a>
</div>`).join('<hr/>')}
  `;
};

const handle = async (req, res) => {

  const credentials = auth(req);

  if (!credentials || !credentials.name || !credentials.pass || credentials.name === 'invalidate') {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="example"');
    res.end('Access Denied. Refresh to try again\n\nUse your AWS access key id \
and secret access key as the username and password respectively');
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
    const list = await s3.listObjects({
      Bucket,
      Delimiter: '/',
    })
    .promise();

    const content = list.CommonPrefixes.map((dir) => `<p><a href="/${Bucket}/${dir.Prefix.slice(0, -1)}">${dir.Prefix.slice(0, -1)}</a></p>`);

    res.end(render('Projects', content.join('')));
  } else if (!testId) {
    const list = await s3.listObjects({
      Bucket,
      Prefix: `${project}/`,
      Delimiter: '/',
    })
    .promise();

    const content = list.CommonPrefixes.map((dir) => {
      const _testId = Number.parseInt(dir.Prefix.split('/')[1], 10);

      return `<p><a href="/${Bucket}/${project}/${_testId}">${new Date(_testId).toUTCString()}</a></p>`;
    });

    res.end(render(`"${project}" Tests`, content.join('')));
  } else {

    const obj = await s3.getObject({
      Bucket,
      Key: `${project}/${testId}/results.json`,
    })
    .promise();

    let json;
    try {
      json = JSON.parse(obj.Body.toString());
    } catch (_) {}

    if (json) {
      if (q.json !== undefined) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(json, null, 2));
      } else {
        res.end(render('Visual Regression Results', renderResults(Bucket, project, testId, json)));
      }
    } else
      throw 'Results not found';
  }
};


module.exports = (req, res) => {
  handle(req, res)
  .catch((err) => {
    res.statusCode = 500;
    res.end(render('Error', `<p class="error">${err.toString()}</p>`));
  });
};
