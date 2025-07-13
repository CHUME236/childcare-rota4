// script.js
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

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBekbb2wy8cO1zJ9lTj7eC64sOZBYa-4PM",
  authDomain: "childcare-rota-4.firebaseapp.com",
  projectId: "childcare-rota-4",
  storageBucket: "childcare-rota-4.firebasestorage.app",
  messagingSenderId: "703216575309",
  appId: "1:703216575309:web:c69096afd83ce1bce40d04",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// Elements
const calendarEl = document.getElementById("calendar");
const summaryBody = document.getElementById("summaryBody");
const filterCaregiver = document.getElementById("filterCaregiver");
const filterChild = document.getElementById("filterChild");
const logoutBtn = document.getElementById("logoutBtn");

// Listen for auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    console.log(`Logged in as ${user.email}`);
    await loadUserData();
    setupButtons();
  } else {
    // Not signed in - redirect to login page
    window.location.href = "login.html";
  }
});

// Logout button
logoutBtn.onclick = () => {
  signOut(auth);
};

let calendarData = {}; // Shared calendar data object

// Load shared calendar data from Firestore
async function loadUserData() {
  try {
    const docRef = doc(db, "sharedCalendar", "main");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      calendarData = docSnap.data().calendarData || {};
      console.log("Loaded calendar data:", calendarData);
    } else {
      calendarData = {};
      console.log("No calendar data found, starting fresh.");
    }
    buildCalendars();
  } catch (error) {
    console.error("Error loading calendar data:", error);
  }
}

// Save shared calendar data to Firestore
async function saveUserData() {
  try {
    if (!calendarData) {
      console.warn("No calendar data to save.");
      return;
    }
    const docRef = doc(db, "sharedCalendar", "main");
    await setDoc(docRef, { calendarData });
    console.log("Saved calendar data successfully.");
  } catch (error) {
    console.error("Error saving calendar data:", error);
  }
}

// Setup buttons and filters
function setupButtons() {
  document.getElementById("showCalendarBtn").onclick = () => toggle("calendar");
  document.getElementById("showSummaryBtn").onclick = () => {
    toggle("summary");
    buildSummary();
  };
  document.getElementById("exportCsvBtn").onclick = exportCSV;
  filterCaregiver.onchange = buildSummary;
  filterChild.onchange = buildSummary;
}

// Show/hide calendar or summary
function toggle(id) {
  document.getElementById("calendar").style.display = id === "calendar" ? "flex" : "none";
  document.getElementById("summary").style.display = id === "summary" ? "block" : "none";
}

// Helper function to pad numbers with leading zeros
const pad = (n) => (n < 10 ? "0" + n : n);

// Build calendar UI
function buildCalendars() {
  calendarEl.innerHTML = "";
  const year = 2025,
    labels = ["July", "August", "September", "October", "November", "December"],
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let m = 6; m <= 11; m++) {
    const sec = document.createElement("section");
    const title = document.createElement("h2");
    title.textContent = `${labels[m - 6]} ${year}`;
    sec.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "month-grid";

    const first = new Date(year, m, 1).getDay(),
      daysIn = new Date(year, m + 1, 0).getDate(),
      offset = (first + 6) % 7;

    for (let i = 0; i < offset; i++) {
      let e = document.createElement("div");
      e.className = "day empty";
      grid.appendChild(e);
    }

    let wk = 0;
    for (let d = 1; d <= daysIn; d++) {
      const dateObj = new Date(year, m, d),
        dow = (dateObj.getDay() + 6) % 7;
      if (dow === 0 || d === 1) wk++;

      // Use zero-padded month and day
      const key = `${year}-${pad(m + 1)}-${pad(d)}`,
        cell = document.createElement("div");
      cell.className = "day";

      const wov = document.createElement("div");
      wov.className = "week-overlay";
      wov.textContent = wk % 2 ? "Week 1" : "Week 2";
      cell.appendChild(wov);

      const drop = createSelect(["", "mother", "father"], "--Drop‑off--", key + "_dropoff"),
        pick = createSelect(["", "mother", "father"], "--Pick‑up--", key + "_pickup"),
        app = createSelect(["", "dentist", "pe", "party", "swimming"], "--Appointment--", key + "_appointment");

      [drop, pick].forEach((sel) => {
        sel.onchange = async () => {
          calendarData[sel._key] = sel.value;
          await saveUserData();
          updateDay(cell);
        };
      });
      app.onchange = async () => {
        calendarData[app._key] = app.value;
        await saveUserData();
        updateDay(cell);
      };

      const ivy = createCheckbox("Ivy", key + "_ivy"),
        ever = createCheckbox("Everly", key + "_everly");

      [ivy, ever].forEach((ch) => {
        ch.querySelector("input").onchange = async (e) => {
          calendarData[ch._key] = e.target.checked;
          await saveUserData();
        };
      });

      const txt = document.createElement("textarea");
      txt.className = "day-comment";
      txt.placeholder = "Add notes...";
      txt.value = calendarData[key + "_comment"] || "";
      txt.oninput = async () => {
        calendarData[key + "_comment"] = txt.value;
        await saveUserData();
      };

      [drop, pick, app, ivy, ever, txt].forEach((el) => cell.appendChild(el));

      // Set initial values from calendarData
      drop.value = calendarData[key + "_dropoff"] || "";
      pick.value = calendarData[key + "_pickup"] || "";
      app.value = calendarData[key + "_appointment"] || "";
      ivy.querySelector("input").checked = calendarData[key + "_ivy"] === true;
      ever.querySelector("input").checked = calendarData[key + "_everly"] === true;

      updateDay(cell);
      grid.appendChild(cell);
    }
    sec.appendChild(grid);
    calendarEl.appendChild(sec);
  }
}

function createSelect(opts, def, key) {
  const s = document.createElement("select");
  s._key = key;
  s.innerHTML = opts
    .map((o) => `<option${o == "" ? " selected" : ""} value="${o}">${o || def}</option>`)
    .join("");
  s.className = oClass(def);
  return s;
}

function createCheckbox(label, key) {
  const l = document.createElement("label");
  l.className = "checkbox-label";
  l._key = key;
  const c = document.createElement("input");
  c.type = "checkbox";
  c.checked = calendarData[key] === true;
  l.appendChild(c);
  l.appendChild(document.createTextNode(" " + label));
  return l;
}

function oClass(str) {
  return str.includes("Drop") ? "select-caregiver" : "select-appointment";
}

function updateDay(cell) {
  ["mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup"].forEach((c) =>
    cell.classList.remove(c)
  );
  const sel = cell.querySelectorAll("select");
  const d = sel[0].value,
    p = sel[1].value;
  if (d) cell.classList.add(d + "-dropoff");
  if (p) cell.classList.add(p + "-pickup");
}

// Build summary table with filtering and date padding
function buildSummary() {
  console.log("Building summary...");
  summaryBody.innerHTML = "";

  const fcRaw = filterCaregiver.value;
  const chRaw = filterChild.value;
  const fc = fcRaw ? fcRaw.toLowerCase() : "";
  const ch = chRaw ? chRaw.toLowerCase() : "";

  console.log(`Filters - Caregiver: "${fc}", Child: "${ch}"`);

  for (const key in calendarData) {
    const val = calendarData[key];
    if (val === null || val === undefined) continue;

    const parts = key.split("_");
    if (parts.length !== 2) continue;

    const [dateRaw, type] = parts;
    if (!["dropoff", "pickup", "appointment", "ivy", "everly", "comment"].includes(type)) continue;

    // Zero pad date parts for consistent display
    const [year, monthRaw, dayRaw] = dateRaw.split("-");
    const month = pad(Number(monthRaw));
    const day = pad(Number(dayRaw));
    const date = `${year}-${month}-${day}`;

    // Apply caregiver filter if set
    if (fc) {
      if (type === "dropoff" || type === "pickup") {
        if (String(val).toLowerCase() !== fc) continue;
      }
    }

    // Apply child filter if set
    if (ch) {
      if ((type === "ivy" && ch !== "ivy") || (type === "everly" && ch !== "everly")) {
        continue;
      }
    }

    // Create table row
    const tr = document.createElement("tr");

    // Date cell
    const dateTd = document.createElement("td");
    dateTd.textContent = date;
    tr.appendChild(dateTd);

    // Type cell
    const typeTd = document.createElement("td");
    let displayType = "";
    switch (type) {
      case "dropoff":
        displayType = "Drop-off";
        break;
      case "pickup":
        displayType = "Pick-up";
        break;
      case "appointment":
        displayType = "Appointment";
        break;
      case "ivy":
        displayType = "Ivy";
        break;
      case "everly":
        displayType = "Everly";
        break;
      case "comment":
        displayType = "Comment";
        break;
      default:
        displayType = type;
    }
    typeTd.textContent = displayType;
    tr.appendChild(typeTd);

    // Value cell
    const valTd = document.createElement("td");
    if ((type === "ivy" || type === "everly") && val === true) {
      valTd.textContent = "Yes";
    } else if (type === "comment") {
      valTd.textContent = val || "";
    } else {
      valTd.textContent = val;
    }
    tr.appendChild(valTd);

    // Add classes for styling
    if (type === "dropoff" || type === "pickup") {
      if (String(val).toLowerCase() === "mother") tr.classList.add("summary-mother-only");
      else if (String(val).toLowerCase() === "father") tr.classList.add("summary-father-only");
    } else if (type === "ivy" || type === "everly") {
      tr.classList.add("summary-child");
    }

    summaryBody.appendChild(tr);
    console.log(`Added summary row: ${date} - ${type} - ${val}`);
  }
}

// Export summary to CSV
function exportCSV() {
  let csv = "Date,Type,Value\n";
  for (const key in calendarData) {
    const val = calendarData[key];
    if (!val) continue;

    const parts = key.split("_");
    if (parts.length !== 2) continue;

    const [dateRaw, type] = parts;
    if (!["dropoff", "pickup", "appointment", "ivy", "everly", "comment"].includes(type)) continue;

    const [year, monthRaw, dayRaw] = dateRaw.split("-");
    const month = pad(Number(monthRaw));
    const day = pad(Number(dayRaw));
    const date = `${year}-${month}-${day}`;

    const displayType = {
      dropoff: "Drop-off",
      pickup: "Pick-up",
      appointment: "Appointment",
      ivy: "Ivy",
      everly: "Everly",
      comment: "Comment",
    }[type] || type;

    let value = val;
    if ((type === "ivy" || type === "everly") && val === true) value = "Yes";

    csv += `"${date}","${displayType}","${value}"\n`;
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "calendar_summary.csv";
  a.click();
  URL.revokeObjectURL(url);
}
