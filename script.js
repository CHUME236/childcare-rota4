import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let calendarData = {};
let currentUser = null;

const calendarEl = document.getElementById("calendar");
const summaryBody = document.getElementById("summaryBody");
const filterCaregiver = document.getElementById("filterCaregiver");
const filterChild = document.getElementById("filterChild");
const logoutBtn = document.getElementById("logoutBtn");

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadCalendarData();
    renderCalendar(currentMonth, currentYear);
    setupButtons();
  } else {
    window.location.href = "login.html";
  }
});

logoutBtn.onclick = () => signOut(auth);

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

async function loadCalendarData() {
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
function createSelect(options, defaultText, key, selectedValue) {
  const select = document.createElement("select");
  select.innerHTML = options.map(opt => `<option value="${opt}"${opt === selectedValue ? " selected" : ""}>${opt || defaultText}</option>`).join("");
  select.value = selectedValue;
  select.onchange = async () => {
    calendarData[key] = select.value;
    updateDayStyle(select.closest(".day"), calendarData[key.replace("pickup", "dropoff")], select.value);
    await saveCalendarData();
  };
  return select;
}

function createCheckbox(label, key, checked) {
  const wrapper = document.createElement("label");
  wrapper.textContent = label;
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.onchange = async () => {
    calendarData[key] = input.checked;
    await saveCalendarData();
  };
  wrapper.prepend(input);
  return wrapper;
}

function updateDayStyle(cell, drop, pick) {
  cell.classList.remove("mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup");
  if (drop === "mother") cell.classList.add("mother-dropoff");
  if (drop === "father") cell.classList.add("father-dropoff");
  if (pick === "mother") cell.classList.add("mother-pickup");
  if (pick === "father") cell.classList.add("father-pickup");
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
