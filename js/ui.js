function getActiveMode() {
  let activeMode = "";

  if (document.getElementById("census-mode").classList.contains("button--active")) {
    activeMode = "census-mode";
  } else if (document.getElementById("postcode-mode").classList.contains("button--active")) {
    activeMode = "postcode-mode";
  }

  return activeMode;
}

function getActiveOutput() {
  let activeOutput = "";

  if (document.getElementById("geojson").classList.contains("button--active")) {
    activeOutput = "geojson";
  } else {
    activeOutput = "csv";
  }

  return activeOutput;
}

function setActiveButton(type, targetElement) {
  if (type == "mode") {
    document.getElementById(getActiveMode()).classList.toggle("button--active");
    document.getElementById(targetElement).classList.toggle("button--active");
  } else {
    document.getElementById(getActiveOutput()).classList.toggle("button--active");
    document.getElementById(targetElement).classList.toggle("button--active");
  }
}

function getRouteOption() {
  return document.querySelector("select[name=output]").value;
}

function displayOutput() {
  if (getActiveOutput() == "geojson") resultsToGeoJSON(finalRoutes);
  if (getActiveOutput() == "csv") resultsToCSV(finalRoutes);
}
