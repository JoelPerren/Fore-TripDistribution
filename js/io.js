/*jshint esversion: 6 */

function readDestinations() {
  if (getActiveMode() == "census-mode") {
    let results = parseCensusInput();
    destinationsInput.value = stringifyArray(results[0]);
    return results[1];
  } else if (getActiveMode() == "postcode-mode") {
    lookupPostcodes().then(results => {
      console.log(results);
      destinationsInput.value = stringifyArray(results[0]);
      return results[1];
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
  var results = [[],[]]; // [[invalid],[valid]]

  inner:
  for (var i = 0; i < inputs.length; i++) {
    outer:
    for (var j = 0; j < censusCentroids.length; j++) {
      match = false;
      if (inputs[i] == censusCentroids[j].name) {
        results[1].push({"name": censusCentroids[j].name, "x": censusCentroids[j].x, "y": censusCentroids[j].y});
        match = true;
        break outer;
      }
    }
    if (!match) results[0].push(inputs[i]);
  }
  return results;
}

// -----------------------------------------------------------------------------
// Postcode-mode
// -----------------------------------------------------------------------------

function parsePostcodes() {

}

function lookupPostcodes() {
  let inputPostcodes = splitPostcodes();
  let promises = [];

  inputPostcodes.forEach(postcode => {
    let apiUrl = getApiUrl(postcode.name);
    promises.push(fetchPostcodeData(apiUrl));
  });

  return Promise.all(promises)
    .then(data => {
      let results = [[],[]]; // [[errors],[valids]]

      for (let i = 0; i < data.length; i++) {
        if (data[i].status == 200) {
          results[1].push({
            "name": inputPostcodes[i].name,
            "x": data[i].result.longitude,
            "y": data[i].result.latitude,
          });

        } else {
          console.log(inputPostcodes[i].name);
          results[0].push(inputPostcodes[i].name);
        }
      }
      return Promise.resolve(results);
    });
}

function splitPostcodes() {
  let inputPostcodes = destinationsInput.value.split(/\n/);
  let processedPostcodes = [];

  inputPostcodes.forEach(element => {
    if (element !== "") {
      if (element.length > 4) {
        let concat = element.replace(/\s+/g, '');
        let length = concat.length;
        let outcode = concat.substring(0, (length - 3));

        processedPostcodes.push({
          "name": concat,
          "outcode": outcode,
        });
      } else {
        processedPostcodes.push({
          "name": element,
          "outcode": element,
        });
      }
    }
  });

  return processedPostcodes;
}

function getApiUrl(postcode) {
  if (postcode.length > 4) {
    return `https://api.postcodes.io/postcodes/${postcode}`;
  } else {
    return `https://api.postcodes.io/outcodes/${postcode}`;
  }
}

// Fetch postcode data from postcodes.io
function fetchPostcodeData(url) {
  return fetch(url, {mode: `cors`})
    .then(checkStatus);
}

function checkStatus(response) {
  if (response.ok) {
    return Promise.resolve(response.json());
  } else {
    return Promise.resolve(response.json());
  }
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function stringifyArray(array) {
  let result = "";
  for (let i = 0; i < array.length; i++) {
    if (array[i] !== "") {
      result += `${array[i]}\n`;
    }
  }
  return result;
}
