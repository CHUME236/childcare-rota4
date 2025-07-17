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
  buildCalendars();
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
}

function toggle(id) {
  document.getElementById("calendar").style.display = id === "calendar" ? "flex" : "none";
  document.getElementById("summary").style.display = id === "summary" ? "block" : "none";
}

function buildCalendars() {
  calendarEl.innerHTML = "";
  const year = 2025;
  const labels = ["July", "August", "September", "October", "November", "December"];

  for (let m = 6; m <= 11; m++) {
    const sec = document.createElement("section");
    const title = document.createElement("h2");
    title.textContent = `${labels[m - 6]} ${year}`;
    sec.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "month-grid";

    const first = new Date(year, m, 1).getDay();
    const daysIn = new Date(year, m + 1, 0).getDate();
    const offset = (first + 6) % 7;

    for (let i = 0; i < offset; i++) {
      let e = document.createElement("div");
      e.className = "day empty";
      grid.appendChild(e);
    }

    let wk = 0;
    for (let d = 1; d <= daysIn; d++) {
      const dateObj = new Date(year, m, d);
      const dow = (dateObj.getDay() + 6) % 7;
      if (dow === 0 || d === 1) wk++;

      const month = String(m + 1).padStart(2, '0');
      const day = String(d).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const cell = document.createElement("div");
      cell.className = "day";

      const wov = document.createElement("div");
      wov.className = "week-overlay";
      wov.textContent = wk % 2 ? "Week 1" : "Week 2";
      cell.appendChild(wov);

      const drop = createSelect(["", "mother", "father"], "--Drop‑off--", key + "_dropoff");
      const pick = createSelect(["", "mother", "father"], "--Pick‑up--", key + "_pickup");
      const app = createSelect(["", "dentist", "pe", "party", "swimming"], "--Appointment--", key + "_appointment");

      [drop, pick, app].forEach(sel => {
        sel.onchange = async () => {
          calendarData[sel._key] = sel.value;
          await saveUserData();
          updateDay(cell);
        };
      });

      const ivy = createCheckbox("Ivy", key + "_ivy");
      const ever = createCheckbox("Everly", key + "_everly");

      [ivy, ever].forEach(ch => {
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

      [drop, pick, app, ivy, ever, txt].forEach(el => cell.appendChild(el));

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
  s.className = def.includes("Drop") ? "select-caregiver" : "select-appointment";
  s.innerHTML = opts.map(o => `<option value="${o}"${o === "" ? " selected" : ""}>${o || def}</option>`).join("");
  return s;
}

function createCheckbox(label, key) {
  const l = document.createElement("label");
  l.className = "checkbox-label";
  l._key = key;
  const c = document.createElement("input");
  c.type = "checkbox";
  l.appendChild(c);
  l.appendChild(document.createTextNode(" " + label));
  return l;
}

function updateDay(cell) {
  ["mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup", "has-appointment"].forEach(c => cell.classList.remove(c));
  const [drop, pick, app] = cell.querySelectorAll("select");
  if (drop.value) cell.classList.add(`${drop.value}-dropoff`);
  if (pick.value) cell.classList.add(`${pick.value}-pickup`);
  if (app.value) cell.classList.add("has-appointment");
}

// UPDATED buildSummary function
function buildSummary() {
  summaryBody.innerHTML = "";

  const fc = filterCaregiver.value.toLowerCase();
  const ch = filterChild.value.toLowerCase();

  const grouped = {};

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

    // Filter logic: allow "all" or matching caregiver and child
    const caregiverMatch = fc === "all" || day.dropoff === fc || day.pickup === fc;
    const childMatch = ch === "all" || day[ch] === true;

    if (!caregiverMatch || !childMatch) return;

    const tr = document.createElement("tr");

    // Include weekday name
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
