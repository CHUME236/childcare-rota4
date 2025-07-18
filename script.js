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

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBekbb2wy8cO1zJ9lTj7eC64sOZBYa-4PM",
  authDomain: "childcare-rota-4.firebaseapp.com",
  projectId: "childcare-rota-4",
  storageBucket: "childcare-rota-4.appspot.com",
  messagingSenderId: "703216575309",
  appId: "1:703216575309:web:c69096afd83ce1bce40d04",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let calendarData = {};
let currentMonth = 6; // July
let currentYear = 2025;

const calendarEl = document.getElementById("calendar");
const summaryBody = document.getElementById("summaryBody");
const filterCaregiver = document.getElementById("filterCaregiver");
const filterChild = document.getElementById("filterChild");
const logoutBtn = document.getElementById("logoutBtn");
const monthLabel = document.getElementById("monthLabel");

onAuthStateChanged(auth, async (user) => {
  const onLoginPage = location.pathname.includes("login");
  if (!user && !onLoginPage) {
    location.replace("login.html");
    return;
  }
  if (user) {
    currentUser = user;
    await loadUserData();
    setupButtons();
    renderCalendar(currentYear, currentMonth);
  }
});

logoutBtn.onclick = () => signOut(auth);

async function loadUserData() {
  const docRef = doc(db, "sharedCalendar", "main");
  const docSnap = await getDoc(docRef);
  calendarData = docSnap.exists() ? docSnap.data().calendarData || {} : {};
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

  document.getElementById("prevMonthBtn").onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
  };
  document.getElementById("nextMonthBtn").onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
  };
}

function toggle(view) {
  calendarEl.style.display = view === "calendar" ? "grid" : "none";
  document.getElementById("summary").style.display = view === "summary" ? "block" : "none";
}

function renderCalendar(year, month) {
  calendarEl.innerHTML = "";

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  monthLabel.textContent = `${monthNames[month]} ${year}`;

  const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  headers.forEach(day => {
    const div = document.createElement("div");
    div.className = "day-header";
    div.textContent = day;
    calendarEl.appendChild(div);
  });

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendarEl.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${month + 1}-${d}`;
    const dayData = {};
    for (const key in calendarData) {
      if (key.startsWith(dateKey)) {
        const suffix = key.split("_")[1];
        dayData[suffix] = calendarData[key];
      }
    }

    const cell = document.createElement("div");
    cell.className = "day";

    const dateNum = document.createElement("div");
    dateNum.className = "date-number";
    dateNum.textContent = d;
    cell.appendChild(dateNum);

    const drop = createSelect(["", "mother", "father"], "--Drop‑off--", dateKey + "_dropoff", dayData["dropoff"]);
    const pick = createSelect(["", "mother", "father"], "--Pick‑up--", dateKey + "_pickup", dayData["pickup"]);
    const app = createSelect(["", "dentist", "pe", "party", "swimming"], "--Appointment--", dateKey + "_appointment", dayData["appointment"]);
    [drop, pick, app].forEach(el => cell.appendChild(el));

    const ivy = createCheckbox("Ivy", dateKey + "_ivy", dayData["ivy"]);
    const ever = createCheckbox("Everly", dateKey + "_everly", dayData["everly"]);
    cell.appendChild(ivy);
    cell.appendChild(ever);

    const txt = document.createElement("textarea");
    txt.placeholder = "Add notes...";
    txt.value = dayData["comment"] || "";
    txt.oninput = () => {
      calendarData[dateKey + "_comment"] = txt.value;
      saveUserData();
    };
    cell.appendChild(txt);

    updateDayClass(cell, drop, pick);

    calendarEl.appendChild(cell);
  }
}

function createSelect(options, placeholder, key, currentValue) {
  const s = document.createElement("select");
  s._key = key;
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt || placeholder;
    s.appendChild(o);
  });
  s.value = currentValue || "";
  s.onchange = () => {
    calendarData[s._key] = s.value;
    saveUserData();
    const cell = s.closest(".day");
    const [drop, pick] = cell.querySelectorAll("select");
    updateDayClass(cell, drop, pick);
  };
  return s;
}

function createCheckbox(label, key, checked) {
  const l = document.createElement("label");
  const c = document.createElement("input");
  c.type = "checkbox";
  c.checked = !!checked;
  c.onchange = () => {
    calendarData[key] = c.checked;
    saveUserData();
  };
  l.appendChild(c);
  l.appendChild(document.createTextNode(" " + label));
  return l;
}

function updateDayClass(cell, drop, pick) {
  cell.classList.remove("mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup");
  if (drop.value) cell.classList.add(`${drop.value}-dropoff`);
  if (pick.value) cell.classList.add(`${pick.value}-pickup`);
}

function buildSummary() {
  summaryBody.innerHTML = "";
  const caregiver = filterCaregiver.value;
  const child = filterChild.value;

  const grouped = {};
  for (const key in calendarData) {
    const [date, field] = key.split("_");
    if (!grouped[date]) grouped[date] = {};
    grouped[date][field] = calendarData[key];
  }

  const dates = Object.keys(grouped).sort();
  dates.forEach(date => {
    const d = grouped[date];
    const cMatch = caregiver === "all" || d.dropoff === caregiver || d.pickup === caregiver;
    const chMatch = child === "all" || d[child] === true;
    if (!cMatch || !chMatch) return;

    const row = document.createElement("tr");
    const weekday = new Date(date).toLocaleDateString(undefined, { weekday: "long" });

    row.innerHTML = `
      <td>${date}</td>
      <td>${weekday}</td>
      <td>${d.dropoff || ""}</td>
      <td>${d.pickup || ""}</td>
      <td>${d.appointment || ""}</td>
      <td>${d.ivy ? "✓" : ""}</td>
      <td>${d.everly ? "✓" : ""}</td>
      <td>${d.comment || ""}</td>
    `;

    summaryBody.appendChild(row);
  });
}

function exportCSV() {
  let csv = "Date,Field,Value\n";
  for (const key in calendarData) {
    const val = calendarData[key];
    csv += `${key.replace("_", ",")},${val}\n`;
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "calendar.csv";
  a.click();
  URL.revokeObjectURL(url);
}
