let prodApiHost = "https://api-v6.spikedata.co.za";
let debugApiHost = "http://localhost:3000";
let settings = {
  apiHost: prodApiHost,
  apiKey: "88246a40-88dc-11e7-bbe2-4f7182116a75", // public test key
  userKey: "ccf55bd0-898f-11e7-9851-a5eee2319d1d"
};

export const FetchResult = {
  NoResponse: -2, // didn't get response
  ServerError: -1, // got response from server (internal error)
  ApiSuccess: 0, // got Api response = success
  ApiSuccessNeedReq2: 1, // got Api response = success, but need a second request = e.g. OTP
  ApiFail: 2 // got Api response = fail
};

const TYPES = {
  NOTSET: 0,
  INPUTS: 1,
  // FN response
  SUCCESS: 2,
  INTERIM: 3,
  // various errors - from FN or from plumbing
  ERROR: 4
};

export async function spikePdfRequest(currentFile, base64Txt, password, updateProgress) {
  let url = `${settings.apiHost}/pdf`;

  let inputs = {
    type: "BANK",
    file: currentFile.name,
    buffer: base64Txt,
    pass: password,
    "x-api-key": settings.apiKey,
    "x-user-key": settings.userKey
  };

  try {
    const json = await postJsonXhr(url, inputs, currentFile, updateProgress);

    // Api response received - could be success or fail
    //  success = { result, requestId, data }
    //  fail = { result, requestId, errorCode, message, messages }
    if (json.type === TYPES.SUCCESS) {
      return {
        result: FetchResult.ApiSuccess,
        requestId: json.requestId,
        data: json.data
      };
    } else {
      return {
        result: FetchResult.ApiFail,
        requestId: json.requestId,
        error: {
          code: json.code,
          message: "failed " + json.code
        }
      };
    }
  } catch (ex) {
    // Didn't get a response: fetch threw an exception - e.g. network timeout
    return { result: FetchResult.NoResponse };
  }
}

export function nop() {}

export async function postJsonXhr(url, data, currentFile, updateProgress = nop) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    // Update progress (can be used to show progress indicator)
    xhr.upload.addEventListener("progress", function(e) {
      updateProgress(currentFile, (e.loaded * 100.0) / e.total || 100);
    });

    xhr.addEventListener("readystatechange", function(e) {
      if (xhr.readyState == 4 && xhr.status == 200) {
        updateProgress(currentFile, 100);
      } else if (xhr.readyState == 4 && xhr.status != 200) {
        // Error. Inform the user
      }
    });
    xhr.onload = function(e) {
      if (xhr.status == 200) {
        var json = JSON.parse(xhr.responseText);
        return resolve(json);
      } else {
        return reject(xhr);
      }
    };
    xhr.onerror = function(e) {
      console.error("xhr onerror", e);
      return reject(xhr);
    };

    xhr.send(JSON.stringify(data));
  });
}
