// -----------------------------------------------------------------------------
// Global Variables
// -----------------------------------------------------------------------------
const mapOptions = {
  center: {lat: 54.4, lng: -1.548},
  zoom: 6,
  disableDefaultUI: true
};
let map = new google.maps.Map(document.getElementById("map"), mapOptions);
const mapBounds = new google.maps.LatLngBounds(
  new google.maps.LatLng(58.421032, -10.774160),
  new google.maps.LatLng(50.508936, 4.343028)
);
const searchBox = new google.maps.places.SearchBox(document.getElementById("pac-input"), {
  bounds: mapBounds
});
let originMarker = new google.maps.Marker();
let destinationMarkers = [];
let destinationsInput = document.getElementById("destinations-input");
let routeLines = [];

// -----------------------------------------------------------------------------
// Load Markers
// -----------------------------------------------------------------------------

function loadDestinations() {
  readDestinations()
    .then(data => {

      data.forEach(destination => {
        destinationMarkers.push(createMarkerCoords(
          destination.name,
          destination.lat,
          destination.lng,
          "Destination"
        ));
      });

      destinationMarkers.forEach(marker => {
        marker.setMap(map);
      });
    });
}

// -----------------------------------------------------------------------------
// Draw Lines
// -----------------------------------------------------------------------------

function drawLines() {
  clearLines();
  var routeOption = document.querySelector("select[name=output]").value;

  for(let i = 0; i < finalRoutes.length; i++) {
    try {
      var line = new google.maps.Polyline({
        path: google.maps.geometry.encoding.decodePath(finalRoutes[i][routeOption].polyline),
        strokeColor: "#000000",
        strokeOpacity: 0.2,
        strokeWeight: 2,
        map: map
      });
      routeLines.push(line);
      line.setMap(map);
    } catch (err) {
      // Do Nothing
    }
  }
}

function clearLines() {
  routeLines.forEach(function (element) {
    element.setMap(null);
  });
  routeLines = [];
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

function clearOrigin() {
  originMarker.setMap(null);
  originMarker = null;
}

function clearDestinations() {
  destinationMarkers.forEach(marker => {
    marker.setMap(null);
  });
  destinationMarkers = [];
  document.querySelector("#run-distribution").disabled = false;
  clearLines();
  finalRoutes = [];
}

// Creates a marker from a LatLng object
function createMarkerLatLng(name, LatLng, type) {
  let marker = new google.maps.Marker({
    title: name,
    position: LatLng,
    icon: getMarkerStyle(type)
  });

  return marker;
}

// Creates a marker from a pair of xy coordinates
function createMarkerCoords(name, lat, lng, type) {
  let marker = new google.maps.Marker({
    title: name,
    position: {lat: lat, lng: lng},
    icon: getMarkerStyle(type)
  });

  return marker;
}

function getMarkerStyle(type) {
  let style;

  if (type == "Origin") {
    style = {
      path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      fillColor: "red",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "white",
      scale: 5
    };
  } else if (type == "Destination") {
    style = {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: "blue",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "white",
      scale: 5
    };
  }

  return style;
}

// -----------------------------------------------------------------------------
// Event Listeners
// -----------------------------------------------------------------------------

// Listen for search event fired and retrieve centre map on location
searchBox.addListener("places_changed", function() {
  var places = searchBox.getPlaces(),
    searchLocation = new google.maps.LatLngBounds();

  if (places.length == 0) {
    return;
  }

  places.forEach(function(place) {
    if (place.geometry.viewport) {
      searchLocation.union(place.geometry.viewport);
    } else {
      searchLocation.extend(place.geometry.location);
    }
  });
  map.fitBounds(searchLocation);
  document.getElementById("pac-input").value = "";
});

// Return LatLng Coordinates when map is clicked
google.maps.event.addListener(map, "click", function(e) {
  clearOrigin();
  originMarker = createMarkerLatLng("Origin", e.latLng, "Origin");
  originMarker.setMap(map);
});
