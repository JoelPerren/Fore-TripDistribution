/*jshint esversion: 6 */

function readDestinations() {
  if (getActiveMode() == "census-mode") {
    let results = parseCensusInput();
    destinationsInput.value = stringifyArray(results[0]);
    return results[1];
  } else if (getActiveMode() == "postcode-mode") {
    parsePostcodeInput().then(results => {
      setTimeout(() => {
        let outputs = results;
        console.log(results);
        destinationsInput.value = stringifyArray(results[0]);
        return outputs[1];
      }, 2000);
    });
  }
}

// -----------------------------------------------------------------------------
// Census-mode
// -----------------------------------------------------------------------------

// Reads census area inputs
function parseCensusInput() {
  var tempInputs = destinationsInput.value.split(/\n/);
  var censusInputs = [];
  var results = [];

  tempInputs.forEach(function(element) {
    if (element != "") {
      censusInputs.push(element);
    }
  });

  return matchCensusInputs(censusInputs);
}

// Matches census inputs to names in census-centroids.js
// Returns an array with the sucessful matches and errors
function matchCensusInputs(inputs) {
  var match = false;
  var matchedDestinations = [];
  var unmatchedDestinations = [];
  var results = [];

  inner:
  for (var i = 0; i < inputs.length; i++) {
    outer:
    for (var j = 0; j < censusCentroids.length; j++) {
      match = false;
      if (inputs[i] == censusCentroids[j].name) {
        matchedDestinations.push({"name": censusCentroids[j].name, "x": censusCentroids[j].x, "y": censusCentroids[j].y});
        match = true;
        break outer;
      }
    }
    if (!match) unmatchedDestinations.push(inputs[i]);
  }
  results.push(unmatchedDestinations, matchedDestinations);
  return results;
}

// -----------------------------------------------------------------------------
// Postcode-mode
// -----------------------------------------------------------------------------

// Reads postcode inputs
function parsePostcodeInput() {
  return new Promise(resolve => {
    const postcodes = splitPostcodes(destinationsInput.value.split(/\n/));
    const results = [[],[]]; // [[error],[valid]]

    postcodes.forEach(element => {
      fetchPostcodeData(element.postcode)
        .then(response => results[1].push({
          "name": response.result.postcode,
          "x": response.result.longitude,
          "y": response.result.latitude
        }))
        .catch(error => fetchOutcodeData(element.outcode)
          .then(response => results[1].push({
            "name": response.result.outcode,
            "x": response.result.longitude,
            "y": response.result.latitude
          }))
          .catch(error => {
            results[0].push(element.postcode);
          })
        );
    });

    resolve(results);
  });
}

// Takes in an array of postcodes and concatanates them. Returns an object array
// containing the postcode, outcode, and incode.
function splitPostcodes(inputs) {
  var postcodes = [];

  inputs.forEach(function(element) {
    if (element.length >= 4) {
      let concat = element.replace(/\s+/g, '');
      let length = concat.length;
      let outcode = concat.substring(0, (length - 3));
      let incode = concat.substring((length -3), length);
      postcodes.push({"postcode": concat, "outcode": outcode, "incode": incode});

    } else {
      let concat = element.replace(/\s+/g, '');
      postcodes.push({"postcode": concat, "outcode": concat, "incode": ""});
    }

  });
  return postcodes;
}

function fetchPostcodeData(postcode) {
  return fetch(`https://api.postcodes.io/postcodes/${postcode}`, {mode: `cors`, method: `GET`})
    .then(checkFetchStatus)
    .then(fetchResponseToJSON)
    .then(json => {
      return json;
    });
}

function checkFetchStatus(response) {
  if (response.status === 200) {
    return Promise.resolve(response);
  } else {
    return Promise.reject(new Error (response.statusText));
  }
}

function fetchResponseToJSON(response) {
  return response.json();
}

function fetchOutcodeData(outcode) {
  return fetch(`https://api.postcodes.io/outcodes/${outcode}`, {mode: `cors`, method: `GET`})
    .then(checkFetchStatus)
    .then(fetchResponseToJSON)
    .then(json => {
      return json;
    });
}

// Utilities

function stringifyArray(array) {
  let result = "";
  for (let i = 0; i < array.length; i++) {
    result += `${array[i]}\n`;
  }
  return result;
}
