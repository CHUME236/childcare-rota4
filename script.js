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
  document.getElementById("showCalendarBtn").onclick = () => {
    document.getElementById("calendar").style.display = "grid";
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
function buildSummary() {
  summaryBody.innerHTML = "";

  const caregiverFilter = filterCaregiver.value;
  const childFilter = filterChild.value;

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

    // ✅ Only show rows with at least one piece of data
    const hasAnyInfo =
      day.dropoff || day.pickup || day.appointment || day.ivy || day.everly || (day.comment && day.comment.trim() !== "");

    if (!hasAnyInfo) return;

    const caregiverMatch =
      caregiverFilter === "all" || day.dropoff === caregiverFilter || day.pickup === caregiverFilter;

    const childMatch =
      childFilter === "all" || day[childFilter];

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
