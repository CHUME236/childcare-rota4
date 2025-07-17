import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBekbb2wy8cO1zJ9lTj7eC64sOZBYa-4PM",
  authDomain: "childcare-rota-4.firebaseapp.com",
  projectId: "childcare-rota-4",
  storageBucket: "childcare-rota-4.firebasestorage.app",
  messagingSenderId: "703216575309",
  appId: "1:703216575309:web:c69096afd83ce1bce40d04",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let calendarData = {};

const calendarEl = document.getElementById("calendar");
const summaryBody = document.getElementById("summaryBody");
const filterCaregiver = document.getElementById("filterCaregiver");
const filterChild = document.getElementById("filterChild");
const logoutBtn = document.getElementById("logoutBtn");

// For month navigation:
let currentYear = 2025;
let currentMonth = 6; // July (0-based: 0=Jan, 6=July)

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadUserData();
    setupButtons();
  } else {
    window.location.href = "login.html";
  }
});

logoutBtn.onclick = () => signOut(auth);

async function loadUserData() {
  const docRef = doc(db, "sharedCalendar", "main");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    calendarData = docSnap.data().calendarData || {};
  } else {
    calendarData = {};
  }
  renderCalendarMonth();
}

async function saveUserData() {
  await setDoc(doc(db, "sharedCalendar", "main"), { calendarData });
}

function setupButtons() {
  document.getElementById("showCalendarBtn").onclick = () => toggle("calendar");
  document.getElementById("showSummaryBtn").onclick = () => {
    toggle("summary");
    buildSummary();
  };
  document.getElementById("exportCsvBtn").onclick = exportCSV;
  filterCaregiver.onchange = buildSummary;
  filterChild.onchange = buildSummary;

  // Add month navigation buttons dynamically:
  addMonthNavigation();
}

function toggle(id) {
  document.getElementById("calendar").style.display = id === "calendar" ? "block" : "none";
  document.getElementById("summary").style.display = id === "summary" ? "block" : "none";
}

function addMonthNavigation() {
  // Create navigation container if doesn't exist
  let nav = document.getElementById("monthNavigation");
  if (!nav) {
    nav = document.createElement("div");
    nav.id = "monthNavigation";
    nav.style.margin = "10px 0";
    nav.style.textAlign = "center";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "« Previous Month";
    prevBtn.onclick = () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendarMonth();
    };

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next Month »";
    nextBtn.onclick = () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendarMonth();
    };

    const label = document.createElement("span");
    label.id = "monthLabel";
    label.style.margin = "0 15px";
    label.style.fontWeight = "bold";

    nav.appendChild(prevBtn);
    nav.appendChild(label);
    nav.appendChild(nextBtn);

    calendarEl.parentNode.insertBefore(nav, calendarEl);
  }
  updateMonthLabel();
}

function updateMonthLabel() {
  const labels = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const label = document.getElementById("monthLabel");
  label.textContent = `${labels[currentMonth]} ${currentYear}`;
}

function renderCalendarMonth() {
  calendarEl.innerHTML = "";

  updateMonthLabel();

  // Create grid container
  const grid = document.createElement("div");
  grid.className = "month-grid";

  // Show day headers: Mon, Tue, Wed, ...
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let dn of dayNames) {
    const dayHeader = document.createElement("div");
    dayHeader.className = "day-header";
    dayHeader.textContent = dn;
    grid.appendChild(dayHeader);
  }

  // Calculate first day of month and number of days
  const firstDate = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Offset to Monday=0 based index for grid (JS getDay: Sunday=0, Monday=1)
  let offset = firstDate.getDay() - 1;
  if (offset === -1) offset = 6; // if Sunday, move to 6 (last day of week)

  // Add empty cells before first day
  for (let i = 0; i < offset; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day empty";
    grid.appendChild(emptyCell);
  }

  // Helper for ordinal date suffix
  function ordinalSuffix(d) {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  // For each day of month, create day cell with all inputs
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "day";

    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    // Date number with ordinal suffix
    const dateNum = document.createElement("div");
    dateNum.className = "date-number";
    dateNum.textContent = `${d}${ordinalSuffix(d)}`;
    cell.appendChild(dateNum);

    // Drop-off select
    const dropoff = createSelect(["", "mother", "father"], "--Drop-off--", dateKey + "_dropoff");
    cell.appendChild(dropoff);

    // Pick-up select
    const pickup = createSelect(["", "mother", "father"], "--Pick-up--", dateKey + "_pickup");
    cell.appendChild(pickup);

    // Appointment select
    const appointment = createSelect(["", "dentist", "pe", "party", "swimming"], "--Appointment--", dateKey + "_appointment");
    cell.appendChild(appointment);

    // Ivy checkbox
    const ivy = createCheckbox("Ivy", dateKey + "_ivy");
    cell.appendChild(ivy);

    // Everly checkbox
    const everly = createCheckbox("Everly", dateKey + "_everly");
    cell.appendChild(everly);

    // Notes textarea
    const notes = document.createElement("textarea");
    notes.className = "day-comment";
    notes.placeholder = "Add notes...";
    notes.value = calendarData[dateKey + "_comment"] || "";
    notes.oninput = async () => {
      calendarData[dateKey + "_comment"] = notes.value;
      await saveUserData();
    };
    cell.appendChild(notes);

    // Set existing values from calendarData if any
    dropoff.value = calendarData[dateKey + "_dropoff"] || "";
    pickup.value = calendarData[dateKey + "_pickup"] || "";
    appointment.value = calendarData[dateKey + "_appointment"] || "";
    ivy.querySelector("input").checked = calendarData[dateKey + "_ivy"] === true;
    everly.querySelector("input").checked = calendarData[dateKey + "_everly"] === true;

    // On change handlers to save data and update styling
    dropoff.onchange = async () => {
      calendarData[dateKey + "_dropoff"] = dropoff.value;
      await saveUserData();
      updateDayColors(cell, dropoff, pickup);
    };
    pickup.onchange = async () => {
      calendarData[dateKey + "_pickup"] = pickup.value;
      await saveUserData();
      updateDayColors(cell, dropoff, pickup);
    };
    appointment.onchange = async () => {
      calendarData[dateKey + "_appointment"] = appointment.value;
      await saveUserData();
    };
    ivy.querySelector("input").onchange = async (e) => {
      calendarData[dateKey + "_ivy"] = e.target.checked;
      await saveUserData();
    };
    everly.querySelector("input").onchange = async (e) => {
      calendarData[dateKey + "_everly"] = e.target.checked;
      await saveUserData();
    };

    updateDayColors(cell, dropoff, pickup);

    grid.appendChild(cell);
  }

  calendarEl.appendChild(grid);
}

// Update cell background colors based on dropoff/pickup selections
function updateDayColors(cell, dropoffSelect, pickupSelect) {
  // Clear all related classes first
  cell.classList.remove("mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup");

  if (dropoffSelect.value === "mother") cell.classList.add("mother-dropoff");
  else if (dropoffSelect.value === "father") cell.classList.add("father-dropoff");

  if (pickupSelect.value === "mother") cell.classList.add("mother-pickup");
  else if (pickupSelect.value === "father") cell.classList.add("father-pickup");
}

// Build summary table rows
function buildSummary() {
  summaryBody.innerHTML = "";

  const fc = filterCaregiver.value.toLowerCase();
  const ch = filterChild.value.toLowerCase();

  const grouped = {};

  // Group data by date from calendarData keys
  for (const key in calendarData) {
    const sepIndex = key.indexOf("_");
    if (sepIndex === -1) continue;

    const date = key.slice(0, sepIndex);
    const field = key.slice(sepIndex + 1);

    if (!grouped[date]) grouped[date] = {};
    grouped[date][field] = calendarData[key];
  }

  const sortedDates = Object.keys(grouped).sort();

  sortedDates.forEach(date => {
    const day = grouped[date];

    const caregiverMatch = fc === "all" || day.dropoff === fc || day.pickup === fc;
    const childMatch = ch === "all" || day[ch] === true;

    if (!caregiverMatch || !childMatch) return;

    const tr = document.createElement("tr");

    const weekday = new Date(date).toLocaleDateString(undefined, { weekday: 'long' });

    tr.innerHTML = `
      <td>${date}</td>
      <td>${weekday}</td>
      <td>${day.dropoff ? capitalize(day.dropoff) : ""}</td>
      <td>${day.pickup ? capitalize(day.pickup) : ""}</td>
      <td>${day.appointment ? capitalize(day.appointment) : ""}</td>
      <td>${day.ivy ? "✓" : ""}</td>
      <td>${day.everly ? "✓" : ""}</td>
      <td>${day.comment || ""}</td>
    `;

    summaryBody.appendChild(tr);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function exportCSV() {
  let csv = "Date,Type,Value\n";
  for (const key in calendarData) {
    const val = calendarData[key];
    if (!val && val !== false) continue;
    csv += `"${key}","${typeof val}","${val}"\n`;
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "calendar-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}
