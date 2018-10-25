/**
 * Calls functions to parse either census or postcode inputs. Errors are
 * displayed in the text area.
 * @return Returns a promise which resolves to an array of objects with the
 * parameters 'name', 'lat', and 'lng'
 */
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

/**
* Reads information from the textarea.
* @return Returns the result of passing the information to matchCensusInputs()
*/
function parseCensusInput() {
  let tempInputs = destinationsInput.value.split(/\n/);
  let censusInputs = [];

  tempInputs.forEach(function(item) {
    if (item != "") {
      censusInputs.push(item);
    }
  });

  return matchCensusInputs(censusInputs);
}

// Matches census inputs to names in census-centroids.js
// Returns an array with the sucessful matches and errors
/**
* Matches the inputs to the names in census-centroids.js
* @return Returns a 2d array with the errors [0] and successful matches [1]
*/
function matchCensusInputs(inputs) {
  let match = false;
  let results = [[],[]]; // [[invalid],[valid]]

  inner:
  for (let i = 0; i < inputs.length; i++) {
    outer:
    for (let j = 0; j < censusCentroids.length; j++) {
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

/**
 * Looksup coordinates of postcodes and processes them into a 2-d results array.
 * @return Returns a 2d array with the errors [0] and successful lookups [1]
 */
function lookupPostcodes() {
  let inputPostcodes = splitPostcodes();
  let promises = [];

  inputPostcodes.forEach(postcode => {
    let apiUrl = getApiUrl(postcode);
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
            results[0].push(`${inputPostcodes[i]} (valid postcode but null xy coordinates)`);
          }
        } else {
          results[0].push(`${inputPostcodes[i]} (invalid postcode)`);
        }
      }
      return Promise.resolve(results);
    });
}

/**
 * Reads and processes postcodes from the text area.
 * @return Returns an array of concatenated postcodes
 */
function splitPostcodes() {
  let inputPostcodes = destinationsInput.value.split(/\n/);
  let processedPostcodes = [];

  inputPostcodes.forEach(element => {
    if (element !== "") {
      let postcode = element.replace(/\s+/g, "");
      processedPostcodes.push(postcode);
    }
  });

  return processedPostcodes;
}

/**
 * Gets the required postcode.io URL for either postcode or outcode lookup.
 * @return Returns a URL for postcode.io
 */
function getApiUrl(postcode) {
  if (postcode.length > 4) {
    return `https://api.postcodes.io/postcodes/${postcode}`;
  } else {
    return `https://api.postcodes.io/outcodes/${postcode}`;
  }
}

/**
 * Makes a cors fetch GET request
 * @return Returns a 'json-ified' response
 */
function fetchPostcodeData(url) {
  return fetch(url, {mode: "cors"})
    .then(response => Promise.resolve(response.json()));
}

// -----------------------------------------------------------------------------
// Output
// -----------------------------------------------------------------------------

/**
 * Parses the finalResults array into a GeoJSON string
 * @return Returns a 'json-ified' string
 */
function resultsToGeoJSON(results) {
  let routeOption = getRouteOption();
  let outputGeoJSON = {
    "type": "FeatureCollection",
    "name": "Routes",
    "features": []
  };

  results.forEach(item => {
    try{
      outputGeoJSON.features.push(routeToJsonFeature(item.name, item[routeOption].polyline));
    } catch (err) {
      // Do nothing
    }
  });

  return JSON.stringify(outputGeoJSON);
}

/**
 * Parses the finalResults array into a GeoJSON string
 * @return Returns a csv string
 */
function resultsToCSV(results) {
  let csv = "Name,Distance (m),Time (s)";
  let routeOption = getRouteOption();

  results.forEach(item => {
    try {
      csv += `\n"${item.name}",${item[routeOption].distance},${item[routeOption].time}`;
    } catch (err) {
      // Do Nothing
    }
  });

  return csv;
}

/** Downloads finalResults either as CSV or GeoJSON */
function downloadData() {
  let outputType = getActiveOutput();
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

/** Downloads finalResults either as CSV */
function downloadCSV(content) {
  let csv = "data:text/csv;charset=utf-8," + content;
  let routeOption = getRouteOption();
  let data = encodeURI(csv);
  let a = document.createElement("a");


  a.setAttribute("href", data);
  a.setAttribute("download", `${routeOption}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Downloads finalResults either as GeoJSON */
function downloadJSON(content) {
  let data = "data:text/csv;charset=utf-8," + encodeURIComponent(content);
  let routeOption = getRouteOption();
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

/**
 * Parses an array into a newline delimited string
 * @return Returns a newline delimited string
 */
function stringifyArray(array) {
  let result = "";
  for (let i = 0; i < array.length; i++) {
    if (array[i] !== "") {
      result += `${array[i]}\n`;
    }
  }
  return result;
}

/**
 * Parses an encoded_polyline return into an array of coordinates
 * @return An array of xy coordinates for each node of the line
 */
function encodedLinetoCoordinateArray(encodedLine) {
  let latLngArray = google.maps.geometry.encoding.decodePath(encodedLine);
  let coordinateArray = [];

  latLngArray.forEach(item => {
    tempArray = [(Math.round(item.lng()*100000)/100000), (Math.round(item.lat()*100000)/100000)];
    coordinateArray.push(tempArray);
  });

  return coordinateArray;
}

/**
 * Parses a single returned route into a JSON feature
 * @return Returns a JSON feature
 */
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
