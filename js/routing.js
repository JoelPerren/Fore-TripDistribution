/*jshint esversion: 6 */

const directionsService = new google.maps.DirectionsService();
let finalRoutes = [];

function calculateTrips() {
  requestAllRoutes()
    .then(routes => {
      console.log("FINISHED");
      console.log(routes);
      finalRoutes = routes;
      drawLines();
    });


}

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

function makeDirectionsRequest(originMarker, destinationMarker) {
  const selectedMode = document.querySelector("select[name=travel-mode]").value;
  const request = {
    origin: originMarker.getPosition(),
    destination: destinationMarker.getPosition(),
    travelMode: selectedMode,
    provideRouteAlternatives: true,
    region: "uk"
  };

  return new Promise((resolve, reject) => {
    directionsService.route(request, (result, status) => {
      if (status == "OK") {
        console.log("Success!!");
        resolve(result);
      } else {
        throw(status);
      }
    });
  });
}

// -----------------------------------------------------------------------------
// Utilitiy Functions
// -----------------------------------------------------------------------------

function checkOriginAndDestinations() {
  if (originMarker.getPosition() !== undefined && destinationMarkers.length !== 0) {
    return true;
  }
  return false;
}

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

function pause(duration) {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}
