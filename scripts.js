const clubGrid = document.querySelector(".club-grid");
const prevBtn = document.querySelector(".btn.prev");
const nextBtn = document.querySelector(".btn.next");
const pagesContainer = document.querySelector(".pagination-item-container");
const stateFilter = document.querySelector(".states-select");
const leagueFilter = document.querySelector(".leagues-select");
const locationFilter = document.querySelector(".location-select");
const submitButton = document.getElementById("filter-submit");
const loadingAnimation = document.getElementById("loading-animation");
//const paginationBtns = document.querySelectorAll(".page-item");

const noResultsMessage = document.createElement("h2");
noResultsMessage.classList.add("none-message");
noResultsMessage.textContent = "No Clubs Found";

document.addEventListener("DOMContentLoaded", function () {
  checkFilters();

  submitButton.addEventListener("click", function () {
    checkFilters();
  });
});

// Checks filters for league, state, and location filters
async function checkFilters() {
  const selectedLocation = locationFilter.value;
  const selectedLeague = leagueFilter.value;
  const selectedState = stateFilter.value;

  await filterByLeague(selectedLeague);
  filterByState(selectedState);
  getUserLocation(selectedLocation);
  
}

let currentPage = 0;
const perPage = 16;
let clubs = [];
let filteredClubs = [];

// Gets User's Location
function getUserLocation(locationValue) {
  showLoadingAnimation();

  if (locationValue === "null") {
    removeLoadingAnimation();
    loadClubs(filteredClubs);
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        filterByLocation(position, locationValue);
      },
      () => {
        alert("Unable to retrieve your location.");
        removeLoadingAnimation();
        loadClubs(filteredClubs);
      }
    );
  } else {
    alert("Geolocation is not supported");
    removeLoadingAnimation();
    loadClubs(filteredClubs);
  }
}

// Filters clubs based on specified radius
function filterByLocation(position, locationValue) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const radiusInMiles = parseFloat(locationValue);

  // Haversine function to calculate distance
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const deltaLon = lon2 - lon1;
    const deltaLambda = (deltaLon * Math.PI) / 180;
    const d =
      Math.acos(
        Math.sin(p1) * Math.sin(p2) +
          Math.cos(p1) * Math.cos(p2) * Math.cos(deltaLambda)
      ) * R;
    return d;
  }

  filteredClubs = clubs.filter(function (club) {
    const distance = haversine(
      latitude,
      longitude,
      club.latitude,
      club.longitude
    );
    return distance <= radiusInMiles;
  });

  currentPage = 0;
  removeLoadingAnimation();
  loadClubs(filteredClubs);
}

// Filters clubs by league
function filterByLeague(leagueValue) {
  let leagueFile;
  if (leagueValue === "All") {
    leagueFile = "./mlsNextClubs.json";
  } else {
    leagueFile = `./${leagueValue}.json`;
  }

  return fetch(leagueFile)
    .then((response) => response.json())
    .then((data) => {
      clubs = data.clubs;
    });
}

// Filters clubs by state
function filterByState(stateValue) {
  if (stateValue === "All") {
    filteredClubs = clubs;
  } else {
    filteredClubs = clubs.filter((club) => club.state === stateValue);
  }
  currentPage = 0;
}

// Loads Clubs
function loadClubs(clubsLoaded) {
  clubGrid.style.removeProperty("height");

  // If no clubs found
  if (clubsLoaded.length === 0) {
    clubGrid.style.height = "226px";
    clubGrid.style.display = "flex";
    clubGrid.appendChild(noResultsMessage);
    return;
  }

  clubGrid.innerHTML = "";
  pagesContainer.innerHTML = "";

  let min = currentPage * perPage;
  let max = Math.min(min + perPage, clubsLoaded.length);

  // Create club items
  for (let i = min; i < max; i++) {
    let club = clubsLoaded[i];
    let nameHolder = document.createElement("div");
    let imgHolder = document.createElement("div");
    let clubImg = document.createElement("img");
    let clubHeading = document.createElement("h4");
    let clubP = document.createElement("p");

    nameHolder.classList.add("club-div");
    imgHolder.classList.add("img-holder");
    clubImg.classList.add("club-img");
    clubHeading.classList.add("club-heading");
    clubP.classList.add("club-p");

    clubHeading.textContent = club.clubName;
    clubP.textContent = club.state;
    clubImg.src = club.image;

    imgHolder.appendChild(clubImg);
    nameHolder.appendChild(imgHolder);
    nameHolder.appendChild(clubHeading);
    nameHolder.appendChild(clubP);
    clubGrid.appendChild(nameHolder);
  }

  // Update pagination page numbers
  for (let i = 0; i < Math.ceil(clubsLoaded.length / perPage); i++) {
    let pageItem = document.createElement("li");
    pageItem.textContent = i + 1;
    pageItem.classList.add("page-item", "pgn-btns");
    if (i === currentPage) {
      pageItem.classList.add("page-active");
    }
    // Page Selector
    pageItem.addEventListener("click", function () {
      currentPage = i;
      loadClubs(clubsLoaded);
    });
    pagesContainer.appendChild(pageItem);
  }
}

// Next Button
nextBtn.addEventListener("click", function () {
  if (currentPage < Math.ceil(filteredClubs.length / perPage) - 1) {
    currentPage++;
    loadClubs(filteredClubs);
  }
});

// Previous Button
prevBtn.addEventListener("click", function () {
  if (currentPage > 0) {
    currentPage--;
    loadClubs(filteredClubs);
  }
});

// Show Loading Animation
function showLoadingAnimation() {
  loadingAnimation.style.display = "flex";
  clubGrid.innerHTML = "";
  clubGrid.style.display = "flex";
  clubGrid.appendChild(loadingAnimation);
}

// Remove Loading Animation
function removeLoadingAnimation() {
  loadingAnimation.style.display = "none";
  clubGrid.style.display = "grid";
  clubGrid.removeChild(loadingAnimation);
}

