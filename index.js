"use-strict";
const http2 = require("http2");
const fs = require("fs");

const certKeyPath =         "/Users/username/project/certificates/myapp.key.pem";
const certPath =            "/Users/username/project/certificates/myapp.crt.pem";
const applicationBundleID = "com.companyname.myAppName";
const pushServerEndpoint =  "https://api.push.apple.com";
const appSharedSecret =     "8234e6db4d244cbfa25bc98a777a5486";
const storeEnvironment =    "sandbox"; 

//
// A simple function to deliver iOS push notifications
// This will return a payload with the following
//      - Status: the HTTP status result 
//      - apns-is: the ID of the transaction as sent back from Apple
//
async function sendiOSNotification(apnsToken, alertTitle, alertBody, result) {
  try {
    //
    // Set up the endpoints
    //
    const host = pushServerEndpoint;
    const devicePath = `/3/device/${apnsToken}`;

    //
    // Define the main payload we're sending to Apple
    //
    body = {
      aps: {
        alert: {
          title: alertTitle,
          body: alertBody,
        },
      },
    };

    //
    // Connect to Apple
    //
    const client = http2.connect(host, {
      key: fs.readFileSync(certKeyPath),
      cert: fs.readFileSync(certPath),
    });
    client.on("error", (err) => console.error(err));

    //
    // Set up the headers for the main request
    //
    headers = {
      ":method": "POST",
      "apns-topic": applicationBundleID,
      ":scheme": "https",
      ":path": devicePath,
    };
    const request = client.request(headers);
    request.on("response", (headers, flags) => {
      const responseHeaders = JSON.stringify(headers); 
      result(responseHeaders);
    });
    request.setEncoding("utf8");

    //
    // Push
    //
    request.write(JSON.stringify(body));
    request.end();
  } catch (e) {
    console.log(`Something went wrong: ${e}`);
  }
}

const targetDeviceAPNSToken =
  "3ab7c3fc9b8f026c37e4cb356deef47875aeb1239842072df11c8a6f7624e656";

(async () => {
  await sendiOSNotification(
    targetDeviceAPNSToken,
    `New Medium Article`,
    "Check out Jonathan Zufi's latest article on how to send iOS push notifications with nodeJS.",
    async (data) => {
      console.log(`APNS response: ${data}`);
    }
  );
})();
