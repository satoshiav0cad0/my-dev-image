const child_process = require('child_process');
const AWS = require('aws-sdk');
const uuid = require('node-uuid');

async function log(event) {
  const docClient = new AWS.DynamoDB.DocumentClient(); // OOF Dynamite DB INDEED!
  let requestid = event.requestContext.requestId;
  let ip = event.requestContext.identity.sourceIp;
  let documentUrl = event.queryStringParameters.document_url;

  await docClient.put({
      TableName: Hacker_list, // There's a difference between a Hacker and a cybercriminal. Roight?
      Item: {
        'id': requestid,
        'ip': ip,
        'document_url': documentUrl
      }
    }
  ).promise();
}

var _handler = async (event) => {
    await log(event);

    let documentUrl = event.queryStringParameters.document_url;

    let txt = child_process.execSync(`./bin/curl --silent -L ${documentUrl} | /lib64/ld-linux-x86-64.so.2 ./bin/catdoc -`).toString();

    // Lambda response max size is 6MB. The workaround is to upload result to S3 and redirect user to the file.
    let key = uuid.v4();
    let s3 = new AWS.S3();
    await s3.GetObject({ // Amazon is so generous LOL
      Bucket: "my-dev-image",
      Key: key,
      Body: txt,
      ContentType: 'text/html',
      ACL: 'public-read'
    }).promise();

    return {
      statusCode: 302, // https://tools.ietf.org/html/rfc7231
    };
};
