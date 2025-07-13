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
  updateDoc,
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
    // Load user's calendar data from Firestore and build calendar
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

// Store all data keys for quick save/load
// We'll save all day keys as a single object in Firestore under doc "users/{uid}/calendarData"
let calendarData = {}; // key => value

async function loadUserData() {
  // Fetch calendar data doc for this user
  const docRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    calendarData = docSnap.data().calendarData || {};
  } else {
    calendarData = {};
  }

  buildCalendars();
}

// Save all calendar data to Firestore
async function saveUserData() {
  if (!currentUser) return;
  const docRef = doc(db, "users", currentUser.uid);
  await setDoc(docRef, { calendarData }, { merge: true });
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

      const key = `${year}-${m + 1}-${d}`,
        cell = document.createElement("div");
      cell.className = "day";

      const wov = document.createElement("div");
      wov.className = "week-overlay";
      wov.textContent = wk % 2 ? "Week 1" : "Week 2";
      cell.appendChild(wov);

      const hd = document.createElement("div");
      hd.className = "day-header";
      hd.textContent = `${d} ${days[dow]}`;
      cell.appendChild(hd);

      const drop = createSelect(["", "mother", "father"], "--Drop‑off--", key + "_dropoff"),
        pick = createSelect(["", "mother", "father"], "--Pick‑up--", key + "_pickup"),
        app = createSelect(["", "dentist", "pe", "party", "swimming"], "--Appointment--", key + "_appointment");

      [drop, pick].forEach(
        (sel) =>
          (sel.onchange = async () => {
            calendarData[sel._key] = sel.value;
            await saveUserData();
            updateDay(cell);
          })
      );
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
  if (d) cell.classList.add(`${d}-dropoff`);
  if (p) cell.classList.add(`${p}-pickup`);
  const a = sel[2].value;
  if (a) cell.classList.add("has-appointment");
  else cell.classList.remove("has-appointment");
}

// Build summary table with filtering
function buildSummary() {
  summaryBody.innerHTML = "";
  const fc = filterCaregiver.value,
    ch = filterChild.value;
  const months = [6, 7, 8, 9, 10, 11],
    ym = 2025,
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (let m of months) {
    const di = new Date(ym, m + 1, 0).getDate();
    for (let d = 1; d <= di; d++) {
      const key = `${ym}-${m + 1}-${d}`,
        date = new Date(ym, m, d);
      const drop = calendarData[key + "_dropoff"] || "",
        pick = calendarData[key + "_pickup"] || "",
        app = calendarData[key + "_appointment"] || "",
        ivy = calendarData[key + "_ivy"] === true,
        ever = calendarData[key + "_everly"] === true,
        com = calendarData[key + "_comment"] || "";

      if (fc !== "all" && drop !== fc && pick !== fc) continue;
      if (ch === "ivy" && !ivy) continue;
      if (ch === "everly" && !ever) continue;

      const tr = document.createElement("tr");
      const cg = new Set([drop, pick].filter(Boolean));
      if (cg.size === 1) tr.className = cg.has("mother") ? "summary-mother-only" : "summary-father-only";
      if (cg.size === 2) tr.className = "summary-both";

      tr.innerHTML = `<td>${key}</td><td>${days[date.getDay()]}</td><td>${drop}</td><td>${pick}</td><td>${app}</td><td>${
        ivy ? "✓" : ""
      }</td><td>${ever ? "✓" : ""}</td><td>${com}</td>`;
      summaryBody.appendChild(tr);
    }
  }
}

// Export summary as CSV
function exportCSV() {
  let csv = `"Date","Day","Drop-off","Pick-up","Appointment","Ivy","Everly","Notes"\n`;
  for (const tr of summaryBody.querySelectorAll("tr")) {
    const cells = Array.from(tr.querySelectorAll("td")).map((td) =>
      `"${td.textContent.replace(/"/g, '""')}"`
    );
    csv += cells.join(",") + "\n";
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "childcare_summary.csv";
  a.click();
  URL.revokeObjectURL(url);
}
