const fs = require('fs');
const fetch = require('node-fetch');
const common = require('../../../Banksy/src/pdf/lib/common');
const { settings } = require('./config');

// Settings
const _apiHost = settings.apiHost;
const _apiKey = settings.apiKey;
const _userKey = settings.userKey;
const _config = {
  pass: undefined,
  pdfs: [
    './src/absa/absa.2017-01.pdf',
    './src/absa/absa.2017-02.pdf',
    './src/absa/absa.2017-03.pdf'
  ],
  output: 'out.csv'
};

//
const FetchResult = {
  NoResponse: -2,  // didn't get response
  ServerError: -1, // got response from server (internal error)
  ApiSuccess: 0, // got Api response = success
  ApiSuccessNeedReq2: 1, // got Api response = success, but need a second request = e.g. OTP
  ApiFail: 2, // got Api response = fail
};

function getPdf(pdfPath, password) {
  pdfPath = config.fixPath(pdfPath);
  let buffer = fs.readFileSync(pdfPath);

  return {
    pdfFileName: path.basename(pdfPath),
    pdfBase64: buffer.toString('base64'),
    pdfPass: password
  };

}

// Spike API request
async function pdfToJson(apiHost, apiKey, userKey, pdfPath, password) {

  let functionName = 'pdf';
  let url = `${apiHost}/${functionName}`;

  inputs = { pdf: getPdf(pdfPath, password) };

  try {
    const response = await fetch(url, {
      method: 'POST',
      timeout: 120000,
      body: JSON.stringify(inputs),
      headers: {
        'x-api-key': apiKey,
        'x-user-key': userKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      }
    });

    // Response received
    if (response.status !== 200) {
      // Server error - not Api response
      return { result: FetchResult.ServerError };
    }

    // Api response received - could be success or fail
    //  success = { result, requestId, data }
    //  fail = { result, requestId, errorCode, message, messages }
    const json = await response.json();
    if (json.result === "success") {
      var filename = pdfPath;
      var extracted = json.data[0];
      return { result: FetchResult.ApiSuccess, requestId: json.requestId, data: extracted };
    } else {
      return { result: FetchResult.ApiFail, requestId: json.requestId, error: json.errorCode, message: json.message || json.messages };
    }
  } catch (ex) {
    // Didn't get a response: fetch threw an exception - e.g. network timeout
    return { result: FetchResult.NoResponse };
  }
}

async function run(apiHost, apiKey, userKey, config) {
  let password = config.pass;
  let transactions = [];
  for (let file of config.pdfs) {
    let request = await pdfToJson(apiHost, apiKey, userKey, file, password);
    if (request.result === FetchResult.ApiSuccess) {
      let trans = request.data.transactions;
      let validation = request.data.validation;
      if (validation && validation.length) {
        console.warn('WARN', request.requestId, 'validation errors', file, validation);
      }
      if (!trans || trans.length === 0) {
        console.warn('WARN', request.requestId, 'no transactions', file);
        continue;
      }
      console.warn('SUCCESS', request.requestId, file);
      transactions = transactions.concat(trans);
    } else {
      console.error("FAILED", request.requestId, file); // let us know if you have a valid .pdf which fails
      return; // for now you'll need to remove the broken pdf from the list
    }
  }

  if (!transactions || transactions.length === 0) {
    console.warn('WARN', 'no transactions in any of the files');
    return;
  }

  // create .csv from transactions[]
  // NOTE: this code can write any json object to csv - it's not hardcoded to the transaction fields (date,description,amount,balance)
  var outpath = config.output;
  var file = fs.createWriteStream(outpath);
  file.on('error', function (err) {
    console.error("Write .csv ERROR", err);
  });
  let first = transactions[0];
  let cols = Object.keys(first);
  let header = `"${cols.join('","')}"\n`;
  file.write(header);
  //file.write(`"date","description","amount","balance"\n`);
  transactions.forEach(function (t) {
    let comma = '';
    cols.forEach(function (c) {
      let x = t[c];
      if (Array.isArray(x)) {
        x = x.join("\n");
      } else if (x instanceof Date) {
        x = x.toJSON();
      }
      file.write(`${comma}"${x}"`);
      comma = ',';
    })
    file.write('\n');
    //let desc = Array.isArray(t.description) ? t.description.join("\n") : t.description;
    //file.write(`${t.date.toJSON()},"${desc}",${t.amount},${t.balance}` + '\n');
  });
  file.end();
  console.error("SUCCESS", outpath);
}
