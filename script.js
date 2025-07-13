// Firebase config and initialization
const firebaseConfig = {
  apiKey: "AIzaSyBekbb2wy8cO1zJ9lTj7eC64sOZBYa-4PM",
  authDomain: "childcare-rota-4.firebaseapp.com",
  projectId: "childcare-rota-4",
  storageBucket: "childcare-rota-4.firebasestorage.app",
  messagingSenderId: "703216575309",
  appId: "1:703216575309:web:c69096afd83ce1bce40d04"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authError = document.getElementById("authError");

const calendarDiv = document.getElementById("calendar");
const summaryDiv = document.getElementById("summary");
const summaryBody = document.getElementById("summaryBody");
const filterCaregiver = document.getElementById("filterCaregiver");
const filterChild = document.getElementById("filterChild");

let currentUser = null;
let userData = {}; // will hold calendar data loaded from Firestore

// --- Auth handlers ---

signupBtn.onclick = async () => {
  authError.textContent = "";
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();
  if (!email || !pass) {
    authError.textContent = "Email and password required.";
    return;
  }
  try {
    await auth.createUserWithEmailAndPassword(email, pass);
  } catch (e) {
    authError.textContent = e.message;
  }
};

loginBtn.onclick = async () => {
  authError.textContent = "";
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();
  if (!email || !pass) {
    authError.textContent = "Email and password required.";
    return;
  }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (e) {
    authError.textContent = e.message;
  }
};

logoutBtn.onclick = () => auth.signOut();

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    authContainer.style.display = "none";
    appContainer.style.display = "block";
    await loadUserData();
    setupButtons();
    toggle("calendar");
  } else {
    currentUser = null;
    authContainer.style.display = "block";
    appContainer.style.display = "none";
    clearCalendarAndSummary();
  }
});

// --- Firestore data handling ---

async function loadUserData() {
  const docRef = db.collection("users").doc(currentUser.uid);
  const doc = await docRef.get();
  if (doc.exists) {
    userData = doc.data() || {};
  } else {
    userData = {}; // no data yet for user
  }
}

async function saveUserData() {
  if (!currentUser) return;
  const docRef = db.collection("users").doc(currentUser.uid);
  await docRef.set(userData);
}

// --- Calendar and Summary functions (adapted for Firestore storage) ---

function setupButtons() {
  document.getElementById("showCalendarBtn").onclick = () => toggle("calendar");
  document.getElementById("showSummaryBtn").onclick = () => { toggle("summary"); buildSummary(); };
  document.getElementById("exportCsvBtn").onclick = exportCSV;
  filterCaregiver.onchange = buildSummary;
  filterChild.onchange = buildSummary;
}

function toggle(id) {
  calendarDiv.style.display = id === "calendar" ? "flex" : "none";
  summaryDiv.style.display = id === "summary" ? "block" : "none";
}

// Clear UI on logout
function clearCalendarAndSummary() {
  calendarDiv.innerHTML = "";
  summaryBody.innerHTML = "";
}

// Build calendar UI
function buildCalendars() {
  calendarDiv.innerHTML = "";
  const year = 2025, labels = ["July", "August", "September", "October", "November", "December"], days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let m = 6; m <= 11; m++) {
    const sec = document.createElement("section");
    const title = document.createElement("h2");
    title.textContent = `${labels[m - 6]} ${year}`;
    sec.appendChild(title);
    const grid = document.createElement("div");
    grid.className = "month-grid";
    const first = new Date(year, m, 1).getDay(), daysIn = new Date(year, m + 1, 0).getDate(), offset = (first + 6) % 7;
    for (let i = 0; i < offset; i++) {
      let e = document.createElement("div");
      e.className = "day empty";
      grid.appendChild(e);
    }
    let wk = 0;
    for (let d = 1; d <= daysIn; d++) {
      const dateObj = new Date(year, m, d), dow = (dateObj.getDay() + 6) % 7;
      if (dow === 0 || d === 1) wk++;
      const key = `${year}-${m + 1}-${d}`, cell = document.createElement("div");
      cell.className = "day";
      const wov = document.createElement("div");
      wov.className = "week-overlay";
      wov.textContent = (wk % 2 ? "Week 1" : "Week 2");
      cell.appendChild(wov);
      const hd = document.createElement("div");
      hd.className = "day-header";
      hd.textContent = `${d} ${days[dow]}`;
      cell.appendChild(hd);

      // Create selects and checkboxes bound to Firestore data
      const drop = createSelect(["", "mother", "father"], "--Drop‑off--", key + "_dropoff");
      const pick = createSelect(["", "mother", "father"], "--Pick‑up--", key + "_pickup");
      const app = createSelect(["", "dentist", "pe", "party", "swimming"], "--Appointment--", key + "_appointment");
      [drop, pick].forEach(sel => sel.onchange = () => {
        userData[sel._key] = sel.value;
        saveUserData();
        updateDay(cell);
      });
      app.onchange = () => {
        userData[app._key] = app.value;
        saveUserData();
        updateDay(cell);
      };

      const ivy = createCheckbox("Ivy", key + "_ivy");
      const ever = createCheckbox("Everly", key + "_everly");
      [ivy, ever].forEach(ch => {
        ch.querySelector("input").onchange = e => {
          userData[ch._key] = e.target.checked;
          saveUserData();
        };
      });

      const txt = document.createElement("textarea");
      txt.className = "day-comment";
      txt.placeholder = "Add notes...";
      txt.value = userData[key + "_comment"] || "";
      txt.oninput = () => {
        userData[key + "_comment"] = txt.value;
        saveUserData();
      };

      [drop, pick, app, ivy, ever, txt].forEach(el => cell.appendChild(el));
      updateDay(cell);
      grid.appendChild(cell);
    }
    sec.appendChild(grid);
    calendarDiv.appendChild(sec);
  }
}

function createSelect(opts, def, key) {
  const s = document.createElement("select");
  s._key = key;
  s.className = oClass(def);
  s.innerHTML = opts.map(o => `<option${o == "" ? ' selected' : ''} value="${o}">${o || def}</option>`).join("");
  if (userData[key] !== undefined) {
    s.value = userData[key];
  }
  return s;
}

function createCheckbox(label, key) {
  const l = document.createElement("label");
  l.className = "checkbox-label";
  l._key = key;
  const c = document.createElement("input");
  c.type = "checkbox";
  c.checked = userData[key] === true || userData[key] === "true";
  l.appendChild(c);
  l.appendChild(document.createTextNode(" " + label));
  return l;
}

function oClass(str) { return str.includes("Drop") ? "select-caregiver" : "select-appointment"; }

function updateDay(cell) {
  ["mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup"].forEach(c => cell.classList.remove(c));
  const sel = cell.querySelectorAll("select");
  const d = sel[0].value, p = sel[1].value;
  if (d) cell.classList.add(`${d}-dropoff`);
  if (p) cell.classList.add(`${p}-pickup`);
  const a = sel[2].value;
  if (a) cell.classList.add("has-appointment"); else cell.classList.remove("has-appointment");
}

// Build summary table
function buildSummary() {
  summaryBody.innerHTML = "";
  const year = 2025;
  const caregiverFilter = filterCaregiver.value;
  const childFilter = filterChild.value;
  for (let m = 6; m <= 11; m++) {
    const daysIn = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysIn; d++) {
      const key = `${year}-${m + 1}-${d}`;
      const dateObj = new Date(year, m, d);
      const dow = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][(dateObj.getDay() + 6) % 7];
      // Filters
      if (caregiverFilter !== "all") {
        const drop = userData[key + "_dropoff"];
        const pick = userData[key + "_pickup"];
        if (drop !== caregiverFilter && pick !== caregiverFilter) continue;
      }
      if (childFilter !== "all") {
        if (childFilter === "ivy" && !userData[key + "_ivy"]) continue;
        if (childFilter === "everly" && !userData[key + "_everly"]) continue;
      }
      const drop = userData[key + "_dropoff"] || "";
      const pick = userData[key + "_pickup"] || "";
      const app = userData[key + "_appointment"] || "";
      const ivy = userData[key + "_ivy"] ? "✔" : "";
      const ever = userData[key + "_everly"] ? "✔" : "";
      const notes = userData[key + "_comment"] || "";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${key}</td>
        <td>${dow}</td>
        <td>${drop}</td>
        <td>${pick}</td>
        <td>${app}</td>
        <td>${ivy}</td>
        <td>${ever}</td>
        <td>${notes}</td>
      `;
      summaryBody.appendChild(tr);
    }
  }
}

// Export CSV
function exportCSV() {
  let csv = "Date,Day,Drop-off,Pick-up,Appointment,Ivy,Everly,Notes\n";
  const year = 2025;
  for (let m = 6; m <= 11; m++) {
    const daysIn = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysIn; d++) {
      const key = `${year}-${m + 1}-${d}`;
      const dateObj = new Date(year, m, d);
      const dow = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][(dateObj.getDay() + 6) % 7];
      const drop = userData[key + "_dropoff"] || "";
      const pick = userData[key + "_pickup"] || "";
      const app = userData[key + "_appointment"] || "";
      const ivy = userData[key + "_ivy"] ? "✔" : "";
      const ever = userData[key + "_everly"] ? "✔" : "";
      const notes = userData[key + "_comment"] || "";
      csv += `"${key}","${dow}","${drop}","${pick}","${app}","${ivy}","${ever}","${notes.replace(/"/g,'""')}"\n`;
    }
  }
  const blob = new Blob([csv], {type: "text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "childcare_summary.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Build calendar after login
auth.onAuthStateChanged(user => {
  if (user) {
    buildCalendars();
  }
});
