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
const showCalendarBtn = document.getElementById("showCalendarBtn");
const showSummaryBtn = document.getElementById("showSummaryBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const calendarContainer = document.getElementById("calendar-container");
const summaryContainer = document.getElementById("summary");

const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const monthYearLabel = document.getElementById("monthYearLabel");

let currentYear, currentMonth; // 0-based month

// Initialize current month to today’s month
function initCurrentMonth() {
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
}

// Helpers
function getOrdinalSuffix(n) {
  if (n > 3 && n < 21) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatDateKey(year, month, day) {
  // Month is 0-based, convert to 1-based with leading zero
  const mm = (month + 1).toString().padStart(2, "0");
  const dd = day.toString().padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function renderCalendar(year, month) {
  calendarEl.innerHTML = "";

  // Show month and year label
  const dateForLabel = new Date(year, month, 1);
  monthYearLabel.textContent = dateForLabel.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  // Render weekday headers
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayNames.forEach((dayName) => {
    const dayHeader = document.createElement("div");
    dayHeader.classList.add("day-name");
    dayHeader.textContent = dayName;
    calendarEl.appendChild(dayHeader);
  });

  // Find out the first day of the month (0=Sunday)
  const firstDay = new Date(year, month, 1).getDay();

  // Find number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Fill empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("day", "empty");
    calendarEl.appendChild(emptyCell);
  }

  // Render each day box
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");

    const dateKey = formatDateKey(year, month, day);

    // Date number with suffix
    const dayNumber = document.createElement("div");
    dayNumber.classList.add("day-number");
    dayNumber.textContent = day + getOrdinalSuffix(day);
    dayDiv.appendChild(dayNumber);

    // Drop-off select
    const dropLabel = document.createElement("label");
    dropLabel.textContent = "Drop-off:";
    dropLabel.setAttribute("for", dateKey + "_dropoff");
    dayDiv.appendChild(dropLabel);

    const dropSelect = document.createElement("select");
    dropSelect.id = dateKey + "_dropoff";
    dropSelect.dataset.type = "dropoff";
    dropSelect.classList.add(
      calendarData[dateKey + "_dropoff"] === "mother"
        ? "mother-dropoff"
        : calendarData[dateKey + "_dropoff"] === "father"
        ? "father-dropoff"
        : ""
    );
    dropSelect.innerHTML = `
      <option value="">--</option>
      <option value="mother">Mother</option>
      <option value="father">Father</option>
    `;
    dropSelect.value = calendarData[dateKey + "_dropoff"] || "";
    dayDiv.appendChild(dropSelect);

    // Pick-up select
    const pickLabel = document.createElement("label");
    pickLabel.textContent = "Pick-up:";
    pickLabel.setAttribute("for", dateKey + "_pickup");
    dayDiv.appendChild(pickLabel);

    const pickSelect = document.createElement("select");
    pickSelect.id = dateKey + "_pickup";
    pickSelect.dataset.type = "pickup";
    pickSelect.classList.add(
      calendarData[dateKey + "_pickup"] === "mother"
        ? "mother-pickup"
        : calendarData[dateKey + "_pickup"] === "father"
        ? "father-pickup"
        : ""
    );
    pickSelect.innerHTML = `
      <option value="">--</option>
      <option value="mother">Mother</option>
      <option value="father">Father</option>
    `;
    pickSelect.value = calendarData[dateKey + "_pickup"] || "";
    dayDiv.appendChild(pickSelect);

    // Appointment select
    const appLabel = document.createElement("label");
    appLabel.textContent = "Appointment:";
    appLabel.setAttribute("for", dateKey + "_appointment");
    dayDiv.appendChild(appLabel);

    const appSelect = document.createElement("select");
    appSelect.id = dateKey + "_appointment";
    appSelect.classList.add(
      calendarData[dateKey + "_appointment"] ? "has-appointment" : ""
    );
    appSelect.innerHTML = `
      <option value="">--</option>
      <option value="none">None</option>
      <option value="doctor">Doctor</option>
      <option value="dentist">Dentist</option>
      <option value="other">Other</option>
    `;
    appSelect.value = calendarData[dateKey + "_appointment"] || "";
    dayDiv.appendChild(appSelect);

    // Ivy checkbox
    const ivyLabel = document.createElement("label");
    ivyLabel.classList.add("checkbox-label");
    ivyLabel.htmlFor = dateKey + "_ivy";

    const ivyCheckbox = document.createElement("input");
    ivyCheckbox.type = "checkbox";
    ivyCheckbox.id = dateKey + "_ivy";
    ivyCheckbox.checked = calendarData[dateKey + "_ivy"] || false;
    ivyLabel.appendChild(ivyCheckbox);
    ivyLabel.appendChild(document.createTextNode("Ivy"));
    dayDiv.appendChild(ivyLabel);

    // Everly checkbox
    const everlyLabel = document.createElement("label");
    everlyLabel.classList.add("checkbox-label");
    everlyLabel.htmlFor = dateKey + "_everly";

    const everlyCheckbox = document.createElement("input");
    everlyCheckbox.type = "checkbox";
    everlyCheckbox.id = dateKey + "_everly";
    everlyCheckbox.checked = calendarData[dateKey + "_everly"] || false;
    everlyLabel.appendChild(everlyCheckbox);
    everlyLabel.appendChild(document.createTextNode("Everly"));
    dayDiv.appendChild(everlyLabel);

    // Notes textarea
    const notesLabel = document.createElement("label");
    notesLabel.textContent = "Notes:";
    notesLabel.setAttribute("for", dateKey + "_comment");
    dayDiv.appendChild(notesLabel);

    const notesTextarea = document.createElement("textarea");
    notesTextarea.id = dateKey + "_comment";
    notesTextarea.classList.add("day-comment");
    notesTextarea.value = calendarData[dateKey + "_comment"] || "";
    dayDiv.appendChild(notesTextarea);

    calendarEl.appendChild(dayDiv);

    // Event listeners for updates
    dropSelect.addEventListener("change", (e) => {
      calendarData[dateKey + "_dropoff"] = e.target.value;
      updateCalendarCellColors(dayDiv, dropSelect, pickSelect, appSelect);
      saveCalendarData();
      updateSummary();
    });
    pickSelect.addEventListener("change", (e) => {
      calendarData[dateKey + "_pickup"] = e.target.value;
      updateCalendarCellColors(dayDiv, dropSelect, pickSelect, appSelect);
      saveCalendarData();
      updateSummary();
    });
    appSelect.addEventListener("change", (e) => {
      calendarData[dateKey + "_appointment"] = e.target.value;
      updateCalendarCellColors(dayDiv, dropSelect, pickSelect, appSelect);
      saveCalendarData();
      updateSummary();
    });
    ivyCheckbox.addEventListener("change", (e) => {
      calendarData[dateKey + "_ivy"] = e.target.checked;
      saveCalendarData();
      updateSummary();
    });
    everlyCheckbox.addEventListener("change", (e) => {
      calendarData[dateKey + "_everly"] = e.target.checked;
      saveCalendarData();
      updateSummary();
    });
    notesTextarea.addEventListener("input", (e) => {
      calendarData[dateKey + "_comment"] = e.target.value;
      saveCalendarData();
      updateSummary();
    });

    // Initial coloring
    updateCalendarCellColors(dayDiv, dropSelect, pickSelect, appSelect);
  }
}

function updateCalendarCellColors(dayDiv, dropSelect, pickSelect, appSelect) {
  // Clear classes
  dayDiv.classList.remove(
    "mother-dropoff",
    "father-dropoff",
    "mother-pickup",
    "father-pickup",
    "has-appointment"
  );

  // Dropoff color
  if (dropSelect.value === "mother") {
    dayDiv.classList.add("mother-dropoff");
  } else if (dropSelect.value === "father") {
    dayDiv.classList.add("father-dropoff");
  }
  // Pickup color
  if (pickSelect.value === "mother") {
    dayDiv.classList.add("mother-pickup");
  } else if (pickSelect.value === "father") {
    dayDiv.classList.add("father-pickup");
  }
  // Appointment highlight
  if (appSelect.value && appSelect.value !== "" && appSelect.value !== "none") {
    dayDiv.classList.add("has-appointment");
  }
}

function saveCalendarData() {
  if (!currentUser) return;
  const userDoc = doc(db, "calendars", currentUser.uid);
  setDoc(userDoc, calendarData).catch((error) => {
    console.error("Error saving calendar data:", error);
  });
}

function loadCalendarData() {
  if (!currentUser) return;
  const userDoc = doc(db, "calendars", currentUser.uid);
  getDoc(userDoc).then((docSnap) => {
    if (docSnap.exists()) {
      calendarData = docSnap.data();
    } else {
      calendarData = {};
    }
    renderCalendar(currentYear, currentMonth);
    updateSummary();
  });
}

function updateSummary() {
  summaryBody.innerHTML = "";
  const filterCare = filterCaregiver.value;
  const filterCh = filterChild.value;

  // Get all keys/dates and sort them
  const dates = new Set();
  Object.keys(calendarData).forEach((key) => {
    const datePart = key.split("_")[0];
    dates.add(datePart);
  });

  const sortedDates = Array.from(dates).sort();

  sortedDates.forEach((date) => {
    const dropoff = calendarData[date + "_dropoff"] || "";
    const pickup = calendarData[date + "_pickup"] || "";
    const appointment = calendarData[date + "_appointment"] || "";
    const ivy = calendarData[date + "_ivy"] || false;
    const everly = calendarData[date + "_everly"] || false;
    const comment = calendarData[date + "_comment"] || "";

    // Apply filters
    if (filterCare !== "all" && dropoff !== filterCare && pickup !== filterCare) {
      return;
    }
    if (filterCh !== "all") {
      if (filterCh === "ivy" && !ivy) return;
      if (filterCh === "everly" && !everly) return;
    }

    const row = document.createElement("tr");

    const dateObj = new Date(date);
    const options = { weekday: "long", year: "numeric", month: "short", day: "numeric" };
    const formattedDate = dateObj.toLocaleDateString("en-US", options);

    const dateCell = document.createElement("td");
    dateCell.textContent = formattedDate;
    row.appendChild(dateCell);

    const weekdayCell = document.createElement("td");
    weekdayCell.textContent = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    row.appendChild(weekdayCell);

    const dropCell = document.createElement("td");
    dropCell.textContent = dropoff;
    row.appendChild(dropCell);

    const pickCell = document.createElement("td");
    pickCell.textContent = pickup;
    row.appendChild(pickCell);

    const appCell = document.createElement("td");
    appCell.textContent = appointment;
    row.appendChild(appCell);

    const ivyCell = document.createElement("td");
    ivyCell.textContent = ivy ? "✓" : "";
    row.appendChild(ivyCell);

    const everlyCell = document.createElement("td");
    everlyCell.textContent = everly ? "✓" : "";
    row.appendChild(everlyCell);

    const notesCell = document.createElement("td");
    notesCell.textContent = comment;
    row.appendChild(notesCell);

    summaryBody.appendChild(row);
  });
}

// Authentication and initialization

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    initCurrentMonth();
    loadCalendarData();
  } else {
    // Redirect to login or show login screen
    window.location.href = "login.html";
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});

showCalendarBtn.addEventListener("click", () => {
  calendarContainer.style.display = "block";
  summaryContainer.style.display = "none";
});

showSummaryBtn.addEventListener("click", () => {
  calendarContainer.style.display = "none";
  summaryContainer.style.display = "block";
  updateSummary();
});

filterCaregiver.addEventListener("change", () => {
  updateSummary();
  renderCalendar(currentYear, currentMonth);
});

filterChild.addEventListener("change", () => {
  updateSummary();
  renderCalendar(currentYear, currentMonth);
});

prevMonthBtn.addEventListener("click", () => {
  if (currentMonth === 0) {
    currentMonth = 11;
    currentYear--;
  } else {
    currentMonth--;
  }
  renderCalendar(currentYear, currentMonth);
});

nextMonthBtn.addEventListener("click", () => {
  if (currentMonth === 11) {
    currentMonth = 0;
    currentYear++;
  } else {
    currentMonth++;
  }
  renderCalendar(currentYear, currentMonth);
});

exportCsvBtn.addEventListener("click", () => {
  exportCSV();
});

function exportCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent +=
    "Date,Drop-off,Pick-up,Appointment,Ivy,Everly,Notes\n";

  Object.keys(calendarData)
    .filter((key) => key.endsWith("_dropoff"))
    .forEach((dropKey) => {
      const dateKey = dropKey.split("_dropoff")[0];
      const dropoff = calendarData[dropKey] || "";
      const pickup = calendarData[dateKey + "_pickup"] || "";
      const appointment = calendarData[dateKey + "_appointment"] || "";
      const ivy = calendarData[dateKey + "_ivy"] ? "Yes" : "No";
      const everly = calendarData[dateKey + "_everly"] ? "Yes" : "No";
      const notes = calendarData[dateKey + "_comment"] || "";

      csvContent += `${dateKey},${dropoff},${pickup},${appointment},${ivy},${everly},"${notes.replace(/"/g, '""')}"\n`;
    });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "childcare_rota.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
