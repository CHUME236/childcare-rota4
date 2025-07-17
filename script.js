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
    buildCalendars();
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
}

async function saveCalendarData() {
  await setDoc(doc(db, "sharedCalendar", "main"), { calendarData });
}

function setupButtons() {
  document.getElementById("showCalendarBtn").onclick = () => {
    document.getElementById("calendar").style.display = "block";
    document.getElementById("summary").style.display = "none";
  };
  document.getElementById("showSummaryBtn").onclick = () => {
    document.getElementById("calendar").style.display = "none";
    document.getElementById("summary").style.display = "block";
    buildSummary();
  };
  document.getElementById("exportCsvBtn").onclick = exportCSV;
  filterCaregiver.onchange = buildSummary;
  filterChild.onchange = buildSummary;
}
function buildCalendars() {
  calendarEl.innerHTML = "";
  const year = 2025;
  const months = ["July", "August", "September", "October", "November", "December"];

  for (let m = 6; m <= 11; m++) {
    const monthSection = document.createElement("section");
    const title = document.createElement("h2");
    title.textContent = `${months[m - 6]} ${year}`;
    monthSection.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "month-grid";

    const firstDay = new Date(year, m, 1).getDay();
    const daysInMonth = new Date(year, m + 1, 0).getDate();

    // Fill empty slots before 1st
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "day empty";
      grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayCell = document.createElement("div");
      dayCell.className = "day";

      const dateLabel = document.createElement("div");
      dateLabel.className = "date-number";
      dateLabel.textContent = `${d}`;
      dayCell.appendChild(dateLabel);

      const drop = createSelect(["", "mother", "father"], "--Drop‑off--", dateKey + "_dropoff");
      const pick = createSelect(["", "mother", "father"], "--Pick‑up--", dateKey + "_pickup");
      const app = createSelect(["", "dentist", "pe", "party", "swimming"], "--Appointment--", dateKey + "_appointment");

      [drop, pick, app].forEach(sel => {
        sel.onchange = async () => {
          calendarData[sel._key] = sel.value;
          await saveCalendarData();
          updateDayStyles(dayCell);
        };
      });

      const ivy = createCheckbox("Ivy", dateKey + "_ivy");
      const ever = createCheckbox("Everly", dateKey + "_everly");

      [ivy, ever].forEach(ch => {
        ch.querySelector("input").onchange = async (e) => {
          calendarData[ch._key] = e.target.checked;
          await saveCalendarData();
        };
      });

      const notes = document.createElement("textarea");
      notes.className = "day-comment";
      notes.placeholder = "Notes...";
      notes.value = calendarData[dateKey + "_comment"] || "";
      notes.oninput = async () => {
        calendarData[dateKey + "_comment"] = notes.value;
        await saveCalendarData();
      };

      drop.value = calendarData[dateKey + "_dropoff"] || "";
      pick.value = calendarData[dateKey + "_pickup"] || "";
      app.value = calendarData[dateKey + "_appointment"] || "";
      ivy.querySelector("input").checked = calendarData[dateKey + "_ivy"] === true;
      ever.querySelector("input").checked = calendarData[dateKey + "_everly"] === true;

      [drop, pick, app, ivy, ever, notes].forEach(el => dayCell.appendChild(el));

      updateDayStyles(dayCell);
      grid.appendChild(dayCell);
    }

    monthSection.appendChild(grid);
    calendarEl.appendChild(monthSection);
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

function updateDayStyles(cell) {
  const [drop, pick] = cell.querySelectorAll("select");
  cell.classList.remove("mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup");

  if (drop.value) cell.classList.add(`${drop.value}-dropoff`);
  if (pick.value) cell.classList.add(`${pick.value}-pickup`);
}
function buildSummary() {
  summaryBody.innerHTML = "";

  const caregiverFilter = filterCaregiver.value.toLowerCase();
  const childFilter = filterChild.value.toLowerCase();

  const grouped = {};
  for (const key in calendarData) {
    const [date, field] = key.split("_");
    if (!grouped[date]) grouped[date] = {};
    grouped[date][field] = calendarData[key];
  }

  const sortedDates = Object.keys(grouped).sort();

  sortedDates.forEach(date => {
    const day = grouped[date];

    const hasAnyInfo = day.dropoff || day.pickup || day.appointment || day.ivy || day.everly || day.comment;
    if (!hasAnyInfo) return;

    const caregiverMatch =
      caregiverFilter === "all" || day.dropoff === caregiverFilter || day.pickup === caregiverFilter;
    const childMatch =
      childFilter === "all" || day[childFilter];

    if (!caregiverMatch || !childMatch) return;

    const tr = document.createElement("tr");
    const weekday = new Date(date).toLocaleDateString(undefined, { weekday: "long" });

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
