/*
 * Global Variables
 */

var activeMode,
    activeOutput;

/*
 * Functions
 */

function getActiveMode() {
  if (document.getElementById("census-mode").classList.contains("button--active")) {
    activeMode = "census-mode";
    return activeMode;
  } else if (document.getElementById("postcode-mode").classList.contains("button--active")) {
    activeMode = "postcode-mode";
    return activeMode;
  } else {
    activeMode = "manual-mode";
    return activeMode;
  }
}

function getActiveOutput() {
  if (document.getElementById("geojson").classList.contains("button--active")) {
    activeOutput = "geojson";
  } else {
    activeOutput = "csv";
  }
}

function setActiveButton(type, targetElement) {
  if (type == "mode") {
    document.getElementById(activeMode).classList.toggle("button--active");
    document.getElementById(targetElement).classList.toggle("button--active");
    activeMode = targetElement;
  } else {
    document.getElementById(activeOutput).classList.toggle("button--active");
    document.getElementById(targetElement).classList.toggle("button--active");
    activeOutput = targetElement;
  }
}
