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
let currentMonthIndex = 0;

const calendarEl = document.getElementById("calendar");
const summaryBody = document.getElementById("summaryBody");
const filterCaregiver = document.getElementById("filterCaregiver");
const filterChild = document.getElementById("filterChild");
const logoutBtn = document.getElementById("logoutBtn");
const monthLabel = document.getElementById("monthLabel");

const months = [
  { name: "July", index: 6 },
  { name: "August", index: 7 },
  { name: "September", index: 8 },
  { name: "October", index: 9 },
  { name: "November", index: 10 },
  { name: "December", index: 11 },
];

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadUserData();
    setupButtons();
    renderCalendar();
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

async function saveUserData() {
  await setDoc(doc(db, "sharedCalendar", "main"), { calendarData });
}

function setupButtons() {
  document.getElementById("showCalendarBtn").onclick = () => {
    toggle("calendar");
    renderCalendar();
  };
  document.getElementById("showSummaryBtn").onclick = () => {
    toggle("summary");
    buildSummary();
  };
  document.getElementById("exportCsvBtn").onclick = exportCSV;
  document.getElementById("prevMonthBtn").onclick = () => {
    currentMonthIndex = Math.max(0, currentMonthIndex - 1);
    renderCalendar();
  };
  document.getElementById("nextMonthBtn").onclick = () => {
    currentMonthIndex = Math.min(months.length - 1, currentMonthIndex + 1);
    renderCalendar();
  };
  filterCaregiver.onchange = buildSummary;
  filterChild.onchange = buildSummary;
}

function toggle(view) {
  document.getElementById("calendar").style.display = view === "calendar" ? "grid" : "none";
  document.getElementById("summary").style.display = view === "summary" ? "block" : "none";
  document.getElementById("monthNavigation").style.display = view === "calendar" ? "block" : "none";
}

function renderCalendar() {
  calendarEl.innerHTML = "";
  const year = 2025;
  const monthInfo = months[currentMonthIndex];
  const m = monthInfo.index;
  const monthName = monthInfo.name;
  monthLabel.textContent = `${monthName} ${year}`;

  const grid = document.createElement("div");
  grid.className = "month-grid";

  // Add weekday headers
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(d => {
    const dayHead = document.createElement("div");
    dayHead.className = "day-header";
    dayHead.textContent = d;
    grid.appendChild(dayHead);
  });

  const first = new Date(year, m, 1).getDay(); // Sunday = 0
  const offset = (first + 6) % 7;
  const daysIn = new Date(year, m + 1, 0).getDate();

  for (let i = 0; i < offset; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysIn; d++) {
    const dateKey = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className = "day";

    const dateNum = document.createElement("div");
    dateNum.className = "date-number";
    dateNum.textContent = d;
    cell.appendChild(dateNum);

    const drop = createSelect(["", "mother", "father"], "--Drop-off--", dateKey + "_dropoff");
    const pick = createSelect(["", "mother", "father"], "--Pick-up--", dateKey + "_pickup");
    const app = createSelect(["", "dentist", "pe", "party", "swimming"], "--Appointment--", dateKey + "_appointment");

    [drop, pick, app].forEach(sel => {
      sel.value = calendarData[sel._key] || "";
      sel.onchange = async () => {
        calendarData[sel._key] = sel.value;
        await saveUserData();
        updateDay(cell);
      };
      cell.appendChild(sel);
    });

    const ivy = createCheckbox("Ivy", dateKey + "_ivy");
    const ever = createCheckbox("Everly", dateKey + "_everly");

    [ivy, ever].forEach(chk => {
      const input = chk.querySelector("input");
      input.checked = calendarData[chk._key] === true;
      input.onchange = async (e) => {
        calendarData[chk._key] = e.target.checked;
        await saveUserData();
      };
      cell.appendChild(chk);
    });

    const txt = document.createElement("textarea");
    txt.placeholder = "Add notes...";
    txt.value = calendarData[dateKey + "_comment"] || "";
    txt.oninput = async () => {
      calendarData[dateKey + "_comment"] = txt.value;
      await saveUserData();
    };
    cell.appendChild(txt);

    updateDay(cell);
    grid.appendChild(cell);
  }

  calendarEl.appendChild(grid);
}

function createSelect(options, placeholder, key) {
  const s = document.createElement("select");
  s._key = key;
  s.innerHTML = options.map(o => `<option value="${o}">${o || placeholder}</option>`).join("");
  return s;
}

function createCheckbox(label, key) {
  const wrapper = document.createElement("label");
  wrapper.className = "checkbox-label";
  wrapper._key = key;
  const box = document.createElement("input");
  box.type = "checkbox";
  wrapper.appendChild(box);
  wrapper.appendChild(document.createTextNode(" " + label));
  return wrapper;
}

function updateDay(cell) {
  ["mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup"].forEach(c => cell.classList.remove(c));
  const [drop, pick] = cell.querySelectorAll("select");
  if (drop.value) cell.classList.add(`${drop.value}-dropoff`);
  if (pick.value) cell.classList.add(`${pick.value}-pickup`);
}

function buildSummary() {
  summaryBody.innerHTML = "";
  const caregiver = filterCaregiver.value.toLowerCase();
  const child = filterChild.value.toLowerCase();

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

    const caregiverMatch = caregiver === "all" || day.dropoff === caregiver || day.pickup === caregiver;
    const childMatch = child === "all" || day[child] === true;

    if (!caregiverMatch || !childMatch) return;

    const tr = document.createElement("tr");
    const weekday = new Date(date).toLocaleDateString(undefined, { weekday: "long" });

    tr.innerHTML = `
      <td>${date}</td>
      <td>${weekday}</td>
      <td>${day.dropoff || ""}</td>
      <td>${day.pickup || ""}</td>
      <td>${day.appointment || ""}</td>
      <td>${day.ivy ? "✓" : ""}</td>
      <td>${day.everly ? "✓" : ""}</td>
      <td>${day.comment || ""}</td>
    `;

    summaryBody.appendChild(tr);
  });
}

function exportCSV() {
  let csv = "Date,Type,Value\\n";
  for (const key in calendarData) {
    const val = calendarData[key];
    if (!val && val !== false) continue;
    csv += `"${key}","${typeof val}","${val}"\\n`;
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "calendar-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}
