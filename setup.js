var debug = true;

var map;
var mapOptions = {
  center: {lat: 54.4, lng: -1.548}, //Leeds
  zoom: 6
};
var directionsService = new google.maps.DirectionsService();
var originMarker;
var destinationMarkerGroup = [];
var routeLines = [];
var routesGroup = {
  name: [],
  route: []
};
var outputGeoJSON = {
  type: "FeatureCollection",
  name: "Routes",
  features: []
};

map = new google.maps.Map(document.getElementById('Map'), mapOptions);

/*
 * Routing Methods
 * */

// Gets routes from origin to each destiantion.
// Has a delay to prevent overloading Google servers.
// Adds each route to the routesGroup object for handling later.
async function calcAllTrips() {
  if (typeof originMarker !== "undefined" && destinationMarkerGroup.length !== 0) {
    document.getElementById("CalculateRoutes").disabled = true;
    document.getElementById("StatusText").innerHTML = "Status: CALCULATING (0%)";
    var numOfDestinations = destinationMarkerGroup.length;
    
    for (let i = 0; i < numOfDestinations; i++) {
      var progress = Math.round((((i+1)/numOfDestinations)*100));
      var retries = 0;
      
      while (retries < 3) {
        if (debug) console.log("Loop: " + (i+1) + " - " + destinationMarkerGroup[i].getTitle());
        var returnedRoute = await calcRoute(originMarker, destinationMarkerGroup[i]);
        if (debug) console.log(returnedRoute);
        if (returnedRoute !== 'ERROR') {
          routesGroup['name'].push(destinationMarkerGroup[i].getTitle());
          routesGroup['route'].push(returnedRoute);
          document.getElementById("StatusText").innerHTML = "Status: CALCULATING (" + progress + "%)";
          break;
        }
        
        else {
          retries++;
          if (debug) console.log("Error. Delaying " + retries*2 + "s...")
          await timeout(retries*2000);
        }
      }
    }
    if (debug) console.log(routesGroup);
    document.getElementById("StatusText").innerHTML = "Status: COMPLETE";
    drawLines();
  }
  
  else {
    alert("Load origins and destinations");
  }
}

// Parameters: Origin and destination Markers
// Output: Returns directionsService.route or 'ERROR'
function calcRoute (origin, destination) {
  var selectedMode = document.getElementById("TransitMode").value;
  var request = {
    origin: origin.getPosition(),
    destination: destination.getPosition(),
    travelMode: selectedMode,
    provideRouteAlternatives: true,
    region: "uk"
  };
  
  return new Promise(function(resolve, reject) {
    if (debug) console.log("Requesting route...");
    directionsService.route(request, function(result, status) {

      if (status == 'OK') {
        console.log(status);
        //return result;
        resolve(result);
      } 

      else {
        if (debug) console.log(status);
        resolve("ERROR");
      }
    });
  });
}

/**
 * Draw and export
 */

function drawLines() {
  clearLines();
  var routeOption = document.getElementById("RouteOption").value;
  
  for(var i = 0; i < routesGroup.name.length; i++) {
    try {
      var line = new google.maps.Polyline({
        path: google.maps.geometry.encoding.decodePath(routesGroup.route[i].routes[routeOption].overview_polyline),
        strokeColor: '#000000',
        strokeOpacity: 1,
        strokeWeight: 3,
        map: map
      });
      routeLines.push(line);
      line.setMap(map);
    } catch (e) {
      console.log("No alternate path; skipping.")
    }
  }
}

function clearLines() {
  routeLines.forEach(function (element) {
    element.setMap(null);
  });
  routeLines = [];
}

function generateJSON () {
  document.getElementById("OutputBox").value = "";
  outputGeoJSON["features"] = [];
  
  for(var i = 0; i < routesGroup.name.length; i++) {
    try{
      outputGeoJSON["features"].push(routeToJSONFeature(routesGroup.name[i], routesGroup.route[i]));
    } catch (e) {
      console.log("No alterate path; skipping.");
    }
  }
  document.getElementById("OutputBox").value = JSON.stringify(outputGeoJSON);
}

/**
 * Load origin and destination
 */

function loadOrigin() {
  var originJSON;
  
  try{
    originJSON = JSON.parse(document.getElementById("OriginBox").value);
    originMarker = new google.maps.Marker({
      title: "Origin",
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: "red",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "white",
        scale: 5
      },
      position: jsonToLatLng(originJSON.features[0]),
      map: map
    });
    document.getElementById("OriginBox").value = "Done.";
  } catch (e) {
    if (debug) console.log(e);
    alert("Error. Check data format is correct.");
  }
}

function loadDestinations() {
  var destinationJSON;
  
  try {
    destinationJSON = JSON.parse(document.getElementById("DestinationsBox").value);
    
    for(var i = 0; i < destinationJSON.features.length; i++){
      destinationMarker = new google.maps.Marker({
        title: destinationJSON.features[i].properties.Name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "blue",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "white",
          scale: 5
        },
        position: jsonToLatLng(destinationJSON.features[i]),
        map: map
      });
      destinationMarkerGroup.push(destinationMarker);
    }
    document.getElementById("DestinationsBox").value = "Done.";
  } catch (e) {
    if (debug) console.log(e);
    alert("Error. Confirm data format is correct.");
  }
}

function clearOrigin() {
  originMarker.setMap(null);
  originMarker = null;
  document.getElementById("OriginBox").value = "";
}

function clearDestinations() {
  destinationMarkerGroup.forEach(function(element) {
    element.setMap(null);
  });
  destinationMarkerGroup = [];
  document.getElementById("DestinationsBox").value = "";
}

/**
 * Utilities
 */

function jsonToLatLng(feature) {
  LatLng = new google.maps.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
  return LatLng;
}

function encodedLinetoCoordinateArray(encodedLine) {
  var coordinates = google.maps.geometry.encoding.decodePath(encodedLine);
  var outsideCoords = [];
  
  coordinates.forEach(function(element) {
    insideCoords = [];
    insideCoords.push(element.lng());
    insideCoords.push(element.lat());
    outsideCoords.push(insideCoords);
  });
  
  return outsideCoords;
}

function routeToJSONFeature(name, route) {
  var routeOption = document.getElementById("RouteOption").value;  
  var feature = {
    "type": "Feature",
    "properties": {
      "Name": name
    },
    "geometry": {
      "type": "LineString",
      "coordinates": encodedLinetoCoordinateArray(route.routes[routeOption].overview_polyline),
    }
  };
  
  return feature;
}

function snapRouteToRoads (route) {
  //Function to take in a route (overview polyline?) and process it with the Roads API to snap it to the road network.
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

