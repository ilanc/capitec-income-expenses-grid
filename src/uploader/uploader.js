// From: https://codepen.io/joezimjs/pen/yPWQbd

let dropArea = document.getElementById("drop-area");

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false)
  document.body.addEventListener(eventName, preventDefaults, false)
});

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false)
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false)
});

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false)

function preventDefaults(e) {
  e.preventDefault()
  e.stopPropagation()
}

function highlight(e) {
  dropArea.classList.add('highlight')
}

function unhighlight(e) {
  dropArea.classList.remove('highlight')
}

function handleDrop(e) {
  var dt = e.dataTransfer
  var files = dt.files

  handleFiles(files)
}

let uploadProgress = []
let progressBar = document.getElementById('progress-bar')

function initializeProgress(numFiles) {
  progressBar.value = 0
  uploadProgress = []

  for (let i = numFiles; i > 0; i--) {
    uploadProgress.push(0)
  }
}

function updateProgress(fileNumber, percent) {
  uploadProgress[fileNumber] = percent
  let total = uploadProgress.reduce((tot, curr) => tot + curr, 0) / uploadProgress.length
  console.debug('update', fileNumber, percent, total)
  progressBar.value = total
}

function handleFiles(files) {
  files = [...files]
  initializeProgress(files.length)
  files.forEach(uploadFile)
  // files.forEach(previewFile)
}

function previewFile(file) {
  let reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onloadend = function () {
    let img = document.createElement('img')
    img.src = reader.result
    document.getElementById('gallery').appendChild(img)
  }
}

function uploadFile(file, i) {
  let reader = new FileReader()
  reader.onloadend = function (event) {
    let base64Txt = event.target.result.replace(/^data:application\/pdf;base64,/, '');
    // cuntPdfRequest(file.name, base64Txt, undefined)
    spikePdfRequest(file.name, base64Txt, undefined)
  }
  reader.readAsDataURL(file)
}

//////

let prodApiHost = 'https://api-v5.spikedata.co.za';
let debugApiHost = 'http://localhost:3000';
let settings = {
  apiHost: debugApiHost, //prodApiHost,
  apiKey: '88246a40-88dc-11e7-bbe2-4f7182116a75', // public test key
  userKey: 'ccf55bd0-898f-11e7-9851-a5eee2319d1d',
};

const FetchResult = {
  NoResponse: -2,  // didn't get response
  ServerError: -1, // got response from server (internal error)
  ApiSuccess: 0, // got Api response = success
  ApiSuccessNeedReq2: 1, // got Api response = success, but need a second request = e.g. OTP
  ApiFail: 2, // got Api response = fail
};

async function spikeRequest(apiKey, userKey, url, inputs) {
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

async function spikePdfRequest(filename, base64Txt, password) {
  let url = `${settings.apiHost}/pdf`;

  let transactions = [];
  let inputs = {
    pdf: {
      pdfFileName: filename,
      pdfBase64: base64Txt,
      pdfPass: password
    }
  };
  let request = await spikeRequest(settings.apiKey, settings.userKey, url, inputs);
  if (request.result === FetchResult.ApiSuccess) {
    let trans = request.data.transactions;
    let validation = request.data.validation;
    if (validation && validation.length) {
      console.warn('WARN', request.requestId, 'validation errors', filename, validation);
    }
    if (!trans || trans.length === 0) {
      console.warn('WARN', request.requestId, 'no transactions', filename);
      return; //continue;
    }
    console.warn('SUCCESS', request.requestId, filename);
    transactions = transactions.concat(trans);
  } else {
    console.error("FAILED", request.requestId, filename); // let us know if you have a valid .pdf which fails
    return; // for now you'll need to remove the broken pdf from the list
  }

  if (!transactions || transactions.length === 0) {
    console.warn('WARN', 'no transactions in any of the files');
    return;
  }
}
