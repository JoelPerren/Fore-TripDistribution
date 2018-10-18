const directionsService = new google.maps.DirectionsService();
let finalRoutes = [];

/**
 * Populates the global finalRoutes array with results and calls drawLines()
 */
function calculateTrips() {
  requestAllRoutes()
    .then(routes => {
      console.log("FINISHED");
      console.log(routes);
      finalRoutes = routes;
      drawLines();
    });


}

/**
 * Calculates routes between origin and each destination.
 * @returns Returns all the routes
 */
async function requestAllRoutes() {
  let data = [];

  if (checkOriginAndDestinations()) {
    let numOfDestinations = destinationMarkers.length;
    for (let i = 0; i < numOfDestinations; i++) {

      console.log(`Requesting route... (${i+1})`);
      document.querySelector("#run-distribution").disabled = true;
      document.querySelector("#run-distribution").innerHTML = `${Math.round(((i+1)/numOfDestinations)*100)}%`;
      let returnedRoute = await request_retry(originMarker, destinationMarkers[i]);
      data.push(processRouteResult(returnedRoute, i));
    }
    document.querySelector("#run-distribution").innerHTML = "Complete";
    return data;

  } else {
    alert("Select origin and destinations");
  }
}

/**
 * Requests a single route between origin and one destination. Retries with an
 * exponential backoff on fail up to 4 times.
 * @returns Returns a successful route
 */
async function request_retry(originMarker, destinationMarker, retries = 4, delay = 250) {
  try {
    console.log(`${delay} ms delay`);
    await pause(delay);
    return await makeDirectionsRequest(originMarker, destinationMarker);
  } catch (err) {
    if (retries === 0) {
      console.log("Mwap mwap");
      throw err;
    }
    console.log("Retrying");
    return await request_retry(originMarker, destinationMarker, retries - 1, delay * 2);
  }
}

/**
 * Requests a single route between origin and one destination.
 * @returns Returns a successful route
 * @throws Throws failed request status
 */
function makeDirectionsRequest(originMarker, destinationMarker) {
  const travelMode = document.querySelector("select[name=travel-mode]").value;
  const request = {
    origin: originMarker.getPosition(),
    destination: destinationMarker.getPosition(),
    travelMode: travelMode,
    provideRouteAlternatives: true,
    region: "uk"
  };

  return new Promise((resolve, reject) => {
    directionsService.route(request, (result, status) => {
      if (status == "OK") {
        console.log("Success!!");
        resolve(result);
      } else {
        console.log(`Fail, throwing ${status}`);
        reject(status);
      }
    });
  });
}

// -----------------------------------------------------------------------------
// Utilitiy Functions
// -----------------------------------------------------------------------------

/**
 * Checks there is a valid origin and destination
 */
function checkOriginAndDestinations() {
  if (originMarker.getPosition() !== undefined && destinationMarkers.length !== 0) {
    return true;
  }
  return false;
}

/**
 * Messily processes a route result into a json object
 * @returns Returns a json object with relevant route information
 */
function processRouteResult(routeResult, iterator) {
  let result;

  if (routeResult.routes.length == 3) {
    result = {
      "name": destinationMarkers[iterator].getTitle(),
      "route1": {
        "polyline": routeResult.routes[0].overview_polyline,
        "distance": routeResult.routes[0].legs[0].distance.value,
        "time": routeResult.routes[0].legs[0].duration.value
      },
      "route2": {
        "polyline": routeResult.routes[1].overview_polyline,
        "distance": routeResult.routes[1].legs[0].distance.value,
        "time": routeResult.routes[1].legs[0].duration.value
      },
      "route3": {
        "polyline": routeResult.routes[2].overview_polyline,
        "distance": routeResult.routes[2].legs[0].distance.value,
        "time": routeResult.routes[2].legs[0].duration.value
      }
    };
  } else if (routeResult.routes.length == 2) {
    result = {
      "name": destinationMarkers[iterator].getTitle(),
      "route1": {
        "polyline": routeResult.routes[0].overview_polyline,
        "distance": routeResult.routes[0].legs[0].distance.value,
        "time": routeResult.routes[0].legs[0].duration.value
      },
      "route2": {
        "polyline": routeResult.routes[1].overview_polyline,
        "distance": routeResult.routes[1].legs[0].distance.value,
        "time": routeResult.routes[1].legs[0].duration.value
      }
    };
  } else if (routeResult.routes.length == 1) {
    result = {
      "name": destinationMarkers[iterator].getTitle(),
      "route1": {
        "polyline": routeResult.routes[0].overview_polyline,
        "distance": routeResult.routes[0].legs[0].distance.value,
        "time": routeResult.routes[0].legs[0].duration.value
      }
    };
  }
  return result;
}

/**
 * Pauses for a given time
 */
function pause(duration) {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}
