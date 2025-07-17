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
  storageBucket: "childcare-rota-4.firebasestorage.app",
  messagingSenderId: "703216575309",
  appId: "1:703216575309:web:c69096afd83ce1bce40d04"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let calendarData = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const calendarEl = document.getElementById("calendar");
const summaryBody = document.getElementById("summaryBody");
const filterCaregiver = document.getElementById("filterCaregiver");
const filterChild = document.getElementById("filterChild");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadCalendarData();
    setupButtons();
    renderCalendar(currentMonth, currentYear);
  } else {
    window.location.href = "login.html";
  }
});

logoutBtn.onclick = () => signOut(auth);

async function loadCalendarData() {
  const docRef = doc(db, "sharedCalendar", "main");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    calendarData = docSnap.data().calendarData || {};
  }
}

async function saveCalendarData() {
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
    renderCalendar(currentMonth, currentYear);
  };

  document.getElementById("nextMonthBtn").onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
  };
}

function toggle(view) {
  calendarEl.style.display = view === "calendar" ? "grid" : "none";
  document.getElementById("summary").style.display = view === "summary" ? "block" : "none";
}

function renderCalendar(month, year) {
  calendarEl.innerHTML = "";

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];

  document.getElementById("monthLabel").textContent = `${monthNames[month]} ${year}`;

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  daysOfWeek.forEach(day => {
    const header = document.createElement("div");
    header.className = "day-header";
    header.textContent = day;
    calendarEl.appendChild(header);
  });

  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day empty";
    calendarEl.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className = "day";

    const dateEl = document.createElement("div");
    dateEl.className = "date-number";
    dateEl.textContent = day;
    cell.appendChild(dateEl);

    const drop = createSelect(["", "mother", "father"], "--Drop-off--", dateKey + "_dropoff");
    const pick = createSelect(["", "mother", "father"], "--Pick-up--", dateKey + "_pickup");
    const app = createSelect(["", "dentist", "pe", "party", "swimming"], "--Appointment--", dateKey + "_appointment");

    [drop, pick, app].forEach(sel => {
      sel.onchange = async () => {
        calendarData[sel._key] = sel.value;
        await saveCalendarData();
        renderCalendar(month, year);
      };
      cell.appendChild(sel);
    });

    const ivy = createCheckbox("Ivy", dateKey + "_ivy");
    const ever = createCheckbox("Everly", dateKey + "_everly");

    [ivy, ever].forEach(ch => {
      ch.querySelector("input").onchange = async (e) => {
        calendarData[ch._key] = e.target.checked;
        await saveCalendarData();
      };
      cell.appendChild(ch);
    });

    const txt = document.createElement("textarea");
    txt.placeholder = "Notes";
    txt.value = calendarData[dateKey + "_comment"] || "";
    txt.oninput = async () => {
      calendarData[dateKey + "_comment"] = txt.value;
      await saveCalendarData();
    };
    cell.appendChild(txt);

    drop.value = calendarData[drop._key] || "";
    pick.value = calendarData[pick._key] || "";
    app.value = calendarData[app._key] || "";
    ivy.querySelector("input").checked = calendarData[ivy._key] || false;
    ever.querySelector("input").checked = calendarData[ever._key] || false;

    if (drop.value) cell.classList.add(`${drop.value}-dropoff`);
    if (pick.value) cell.classList.add(`${pick.value}-pickup`);

    calendarEl.appendChild(cell);
  }
}

function createSelect(options, placeholder, key) {
  const select = document.createElement("select");
  select._key = key;
  options.forEach(value => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value || placeholder;
    select.appendChild(opt);
  });
  return select;
}

function createCheckbox(label, key) {
  const wrapper = document.createElement("label");
  wrapper._key = key;
  const input = document.createElement("input");
  input.type = "checkbox";
  wrapper.appendChild(input);
  wrapper.appendChild(document.createTextNode(" " + label));
  return wrapper;
}

function buildSummary() {
  summaryBody.innerHTML = "";
  const caregiverFilter = filterCaregiver.value;
  const childFilter = filterChild.value;

  const grouped = {};
  for (const key in calendarData) {
    const [date, field] = key.split("_");
    if (!grouped[date]) grouped[date] = {};
    grouped[date][field] = calendarData[key];
  }

  const sortedDates = Object.keys(grouped).sort();

  sortedDates.forEach(date => {
    const day = grouped[date];
    const caregiverMatch = caregiverFilter === "all" || day.dropoff === caregiverFilter || day.pickup === caregiverFilter;
    const childMatch = childFilter === "all" || day[childFilter];

    if (!caregiverMatch || !childMatch) return;

    const row = document.createElement("tr");
    const weekday = new Date(date).toLocaleDateString(undefined, { weekday: "long" });

    row.innerHTML = `
      <td>${date}</td>
      <td>${weekday}</td>
      <td>${capitalize(day.dropoff || "")}</td>
      <td>${capitalize(day.pickup || "")}</td>
      <td>${capitalize(day.appointment || "")}</td>
      <td>${day.ivy ? "✓" : ""}</td>
      <td>${day.everly ? "✓" : ""}</td>
      <td>${day.comment || ""}</td>
    `;
    summaryBody.appendChild(row);
  });
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
  a.download = "calendar_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
