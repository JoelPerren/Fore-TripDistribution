function readDestinations() {
  return new Promise(resolve => {
    if (getActiveMode() == "census-mode") {
      let results = parseCensusInput();
      destinationsInput.value = stringifyArray(results[0]);
      document.querySelector("p[class=status-text]").innerHTML = `${results[0].length} errors`;
      resolve(results[1]);
    } else if (getActiveMode() == "postcode-mode") {
      lookupPostcodes().then(results => {
        destinationsInput.value = stringifyArray(results[0]);
        document.querySelector("p[class=status-text]").innerHTML = `${results[0].length} errors`;
        resolve(results[1]);
      });
    }
  });
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
        results[1].push({"name": censusCentroids[j].name, "lat": censusCentroids[j].y, "lng": censusCentroids[j].x});
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
          if (data[i].result.longitude !== null && data[i].result.latitude !== null) {
            results[1].push({
              "name": inputPostcodes[i].name,
              "lng": data[i].result.longitude,
              "lat": data[i].result.latitude,
            });
          } else {
            results[0].push(`${inputPostcodes[i].name} (valid postcode but null xy coordinates)`);
          }
        } else {
          results[0].push(`${inputPostcodes[i].name} (invalid postcode)`);
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
        let concat = element.replace(/\s+/g, "");
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
  return fetch(url, {mode: "cors"})
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
// Output
// -----------------------------------------------------------------------------

function resultsToGeoJSON(results) {
  let routeOption = document.querySelector("select[name=output]").value;
  let outputGeoJSON = {
    "type": "FeatureCollection",
    "name": "Routes",
    "features": []
  };

  if (routeOption == "route1") {
    results.forEach(item => {
      outputGeoJSON.features.push(routeToJsonFeature(item.name, item.route1.polyline));
    });
  } else if (routeOption == "route2") {
    results.forEach(item => {
      try {
        outputGeoJSON.features.push(routeToJsonFeature(item.name, item.route2.polyline));
      } catch (err) {
        // Do nothing
      }
    });
  } else if (routeOption == "route3") {
    results.forEach(item => {
      try {
        outputGeoJSON.features.push(routeToJsonFeature(item.name, item.route3.polyline));
      } catch (err) {
        // Do nothing
      }
    });
  }

  return JSON.stringify(outputGeoJSON);
}

function resultsToCSV(results) {
  let csv = "Name,Distance (m),Time (s)";
  let routeOption = document.querySelector("select[name=output]").value;

  try {
    results.forEach(item => {
      csv += `\n"${item.name}",${item[routeOption].distance},${item[routeOption].time}`;
    });
  } catch (err) {
    // Do Nothing
  }

  return csv;
}

function downloadData() {
  let outputType = activeOutput;
  if (finalRoutes.length == 0) {
    alert("No results");
  } else {
    if (outputType == "csv") {
      downloadCSV(resultsToCSV(finalRoutes));
    } else if (outputType == "geojson") {
      downloadJSON(resultsToGeoJSON(finalRoutes));
    }
  }
}

function downloadCSV(content) {
  let csv = "data:text/csv;charset=utf-8," + content;
  let routeOption = document.querySelector("select[name=output]").value;
  let data = encodeURI(csv);
  let a = document.createElement("a");


  a.setAttribute("href", data);
  a.setAttribute("download", `${routeOption}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadJSON(content) {
  let data = "data:text/csv;charset=utf-8," + encodeURIComponent(content);
  let routeOption = document.querySelector("select[name=output]").value;
  let a = document.createElement("a");

  a.setAttribute("href", data);
  a.setAttribute("download", `${routeOption}.geojson`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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

function encodedLinetoCoordinateArray(encodedLine) {
  let latLngArray = google.maps.geometry.encoding.decodePath(encodedLine);
  let coordinateArray = [];

  latLngArray.forEach(item => {
    tempArray = [item.lng(), item.lat()];
    coordinateArray.push(tempArray);
  });

  return coordinateArray;
}

function routeToJsonFeature(name, polyline) {
  let jsonFeature = {
    "type": "Feature",
    "properties": {
      "Name": name
    },
    "geometry": {
      "type": "LineString",
      "coordinates": encodedLinetoCoordinateArray(polyline),
    }
  };

  return jsonFeature;
}
