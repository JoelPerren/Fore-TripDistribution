/*
 * Global Variables
 */

var debug = true,
    mapOptions = {

      // Centre on Leeds
      center: {lat: 54.4, lng: -1.548},
      zoom: 6,
      disableDefaultUI: true

    },
    map,
    mapBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(58.421032, -10.774160),
      new google.maps.LatLng(50.508936, 4.343028)),
    searchBox,
    originMarker,
    destinationMarkers = [];

searchBox = new google.maps.places.SearchBox(document.getElementById("pac-input"), {
  bounds: mapBounds
});

/*********************
 * Utility Functions *
 *********************/

// Initialise the map - called in HTML once Google API has loaded
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), mapOptions);
}

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
