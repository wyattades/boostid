import 'aws-sdk/global';
import S3 from 'aws-sdk/clients/s3';
import request from 'superagent';


const DEV = process.env.NODE_ENV === 'development';

const STORAGE_KEY = 'boostid_aws_auth';

const s3 = new S3({
  apiVersion: '2006-03-01',
});


let auth = null;

export const init = () => {
  try {
    const _auth = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (_auth && typeof _auth === 'object') {
      const { accessKeyId, secretAccessKey } = _auth;
      if (accessKeyId && secretAccessKey)
        login(accessKeyId, secretAccessKey);
    }
  } catch (_) {}
};


export const login = async (accessKeyId, secretAccessKey) => {

  auth = {
    accessKeyId,
    secretAccessKey,
  };

  s3.config.update(auth);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
};

export const logout = () => {
  window.localStorage.removeItem(STORAGE_KEY);
};

export const getAuth = () => auth;


export const getBuckets = async () => {

  const { body } = await request.post(DEV ? 'http://localhost:3000' : '/list-buckets')
  .type('json').accept('json')
  .send(auth);

  // const body = await window.fetch(DEV ? 'http://localhost:3000' : '/list-buckets', {
  //   method: 'POST',
  //   body: JSON.stringify(auth),
  // })
  // .then((res) => {
  //   if (res.code === 200)
  //     return res.json();
  //   else throw { code: res.status, message: res.statusText };
  // });

  if (body && typeof body === 'object' && Array.isArray(body.buckets))
    return body.buckets;

  throw { code: 500 };

  // const list = await s3.listBuckets()
  // .promise();

  // return list.Buckets.map((bucket) => bucket.Name);
};

export const getProjects = async ({ bucket }) => {
  const list = await s3.listObjects({
    Bucket: bucket,
    Delimiter: '/',
  })
  .promise();

  return list.CommonPrefixes.map((dir) => dir.Prefix.slice(0, -1));
};

export const getTests = async ({ bucket, project }) => {

  const list = await s3.listObjects({
    Bucket: bucket,
    Prefix: `${project}/`,
    Delimiter: '/',
  })
  .promise();

  return list.CommonPrefixes.map((dir) => {
    const id = dir.Prefix.split('/')[1];
    const time = Number.parseInt(id, 10);

    return {
      id,
      time,
    };
  }).sort((a, b) => b.time - a.time);
};

export const getResults = async ({ bucket, project, test }) => {
  
  const obj = await s3.getObject({
    Bucket: bucket,
    Key: `${project}/${test}/results.json`,
  })
  .promise();

  let json;
  try {
    json = JSON.parse(obj.Body.toString());
  } catch (_) {}

  if (!json) return {};

  const diffFiles = [];

  // for each file
  for (const { assertionResults } of json.testResults.testResults) {

    // for each test in that file
    for (const assertResult of assertionResults) {
      if (assertResult.failureMessages && assertResult.failureMessages.length) {
        const match = assertResult.failureMessages[0].match(/([^\s/]+?-diff\.png)/);
        if (match) {
          diffFiles.push({
            label: assertResult.ancestorTitles.slice(1).concat([ assertResult.title ]),
            filename: `https://${bucket}.s3.amazonaws.com/${project}/${test}/${encodeURIComponent(match[1])}`,
          });
        }
      }
    }
  }

  return { json, diffFiles };
};

const deleteDir = async (bucket, dir) => {

  const listedObjects = await s3.listObjectsV2({
    Bucket: bucket,
    Prefix: dir,
  }).promise();

  if (listedObjects.Contents.length === 0) return;

  await s3.deleteObjects({
    Bucket: bucket,
    Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) }
  }).promise();

  if (listedObjects.IsTruncated) await deleteDir(bucket, dir);
};

export const deleteTests = async (bucket, project, testIds) => {
  await Promise.all(testIds.map((testId) => deleteDir(bucket, `${project}/${testId}/`)))
};
