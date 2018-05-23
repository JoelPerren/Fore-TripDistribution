/*jshint esversion: 6 */

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

// -----------------------------------------------------------------------------
// Load Markers
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

// Initialise the map - called in HTML once Google API has loaded
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), mapOptions);
}

function clearOrigin() {
  originMarker.setMap(null);
  originMarker = null;
}

// Place a marker on the map
function createMarker(name, LatLng, type) {
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

  let marker = new google.maps.Marker({
    title: name,
    position: LatLng,
    icon: style
  });

  return marker;
}

// -----------------------------------------------------------------------------
// Event Listeners
// -----------------------------------------------------------------------------

// Listen for search event fired and retrieve centre map on location
searchBox.addListener('places_changed', function() {
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
  originMarker = createMarker("Origin", e.latLng, "Origin");
  originMarker.setMap(map);
});
