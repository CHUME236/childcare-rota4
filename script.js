// Import Firebase SDK (make sure your environment supports ES modules or use a bundler)
// If you’re running this directly in browser without modules, you'll need to include Firebase scripts via <script> tags instead.
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBekbb2wy8cO1zJ9lTj7eC64sOZBYa-4PM",
  authDomain: "childcare-rota-4.firebaseapp.com",
  projectId: "childcare-rota-4",
  storageBucket: "childcare-rota-4.firebasestorage.app",
  messagingSenderId: "703216575309",
  appId: "1:703216575309:web:c69096afd83ce1bce40d04"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======== Auth UI elements =======
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");
const authMessage = document.getElementById("auth-message");

loginBtn.onclick = () => {
  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => authMessage.textContent = "Logged in successfully.")
    .catch(e => authMessage.textContent = "Login error: " + e.message);
};

signupBtn.onclick = () => {
  createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => authMessage.textContent = "Account created & logged in.")
    .catch(e => authMessage.textContent = "Sign up error: " + e.message);
};

logoutBtn.onclick = () => {
  signOut(auth).then(() => authMessage.textContent = "Logged out.");
};

onAuthStateChanged(auth, user => {
  if (user) {
    loginBtn.style.display = "none";
    signupBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    emailInput.style.display = "none";
    passwordInput.style.display = "none";
    authMessage.textContent = `Welcome, ${user.email}`;
    buildCalendars();
    loadUserData(user.uid);
  } else {
    loginBtn.style.display = "inline-block";
    signupBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    emailInput.style.display = "inline-block";
    passwordInput.style.display = "inline-block";
    authMessage.textContent = "";
    clearCalendarData();
  }
});

// Save user data to Firestore
async function saveUserData(userId, key, value) {
  const userDocRef = doc(db, "users", userId);
  const docSnap = await getDoc(userDocRef);
  let data = {};
  if (docSnap.exists()) {
    data = docSnap.data();
  }
  data[key] = value;
  await setDoc(userDocRef, data);
}

// Load user data from Firestore and apply to UI
async function loadUserData(userId) {
  const userDocRef = doc(db, "users", userId);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    applyDataToUI(data);
  } else {
    clearCalendarData();
  }
}

function clearCalendarData() {
  // Clear selects, checkboxes, textareas from calendar UI
  document.querySelectorAll("select").forEach(s => s.value = "");
  document.querySelectorAll("label.checkbox-label input").forEach(c => c.checked = false);
  document.querySelectorAll("textarea.day-comment").forEach(t => t.value = "");
  document.querySelectorAll(".day").forEach(updateDay);
}

function applyDataToUI(data) {
  for (const key in data) {
    const value = data[key];
    const select = document.querySelector(`select[_key='${key}']`);
    if (select) select.value = value;

    const label = [...document.querySelectorAll("label.checkbox-label")].find(l => l._key === key);
    if (label) label.querySelector("input").checked = value === "true" || value === true;

    const textarea = document.querySelector(`textarea.day-comment[_key='${key}']`);
    if (textarea) textarea.value = value;
  }
  document.querySelectorAll(".day").forEach(updateDay);
}

// ========== Your original calendar code below, slightly modified to save to Firestore ======

document.addEventListener("DOMContentLoaded", () => {
  setupButtons();
  // buildCalendars() now called after login
});

function setupButtons() {
  document.getElementById("showCalendarBtn").onclick = () => toggle("calendar");
  document.getElementById("showSummaryBtn").onclick = () => { toggle("summary"); buildSummary(); };
  document.getElementById("exportCsvBtn").onclick = exportCSV;
  document.getElementById("filterCaregiver").onchange = buildSummary;
  document.getElementById("filterChild").onchange = buildSummary;
}

function toggle(id) {
  document.getElementById("calendar").style.display = id=="calendar"?"flex":"none";
  document.getElementById("summary").style.display = id=="summary"?"block":"none";
}

function buildCalendars() {
  const cal = document.getElementById("calendar");
  cal.innerHTML="";
  const year=2025, labels=["July","August","September","October","November","December"], days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  for (let m=6;m<=11;m++){
    const sec=document.createElement("section");
    const title=document.createElement("h2"); title.textContent=`${labels[m-6]} ${year}`; sec.appendChild(title);
    const grid=document.createElement("div"); grid.className="month-grid";
    const first=new Date(year,m,1).getDay(), daysIn=new Date(year,m+1,0).getDate(), offset=(first+6)%7;
    for(let i=0;i<offset;i++){let e=document.createElement("div");e.className="day empty";grid.appendChild(e);}
    let wk=0;
    for(let d=1;d<=daysIn;d++){
      const dateObj=new Date(year,m,d), dow=(dateObj.getDay()+6)%7;
      if(dow===0||d===1) wk++;
      const key=`${year}-${m+1}-${d}`, cell=document.createElement("div"); cell.className="day";
      const wov=document.createElement("div"); wov.className="week-overlay"; wov.textContent=(wk%2? "Week 1":"Week 2"); cell.appendChild(wov);
      const hd=document.createElement("div"); hd.className="day-header"; hd.textContent=`${d} ${days[dow]}`; cell.appendChild(hd);
      const drop=createSelect(["","mother","father"],"--Drop‑off--",key+"_dropoff");
      const pick=createSelect(["","mother","father"],"--Pick‑up--",key+"_pickup");
      const app=createSelect(["","dentist","pe","party","swimming"],"--Appointment--",key+"_appointment");
      [drop,pick].forEach(sel => sel.onchange=()=> {
        if(auth.currentUser) saveUserData(auth.currentUser.uid, sel._key, sel.value);
        updateDay(cell);
      });
      app.onchange=() => {
        if(auth.currentUser) saveUserData(auth.currentUser.uid, app._key, app.value);
        updateDay(cell);
      };
      const ivy=createCheckbox("Ivy",key+"_ivy"), ever=createCheckbox("Everly",key+"_everly");
      [ivy,ever].forEach(ch=>ch.querySelector("input").onchange=e=> {
        if(auth.currentUser) saveUserData(auth.currentUser.uid, ch._key, e.target.checked);
      });
      const txt=document.createElement("textarea"); txt.className="day-comment"; txt.placeholder="Add notes..."; txt._key=key+"_comment";
      txt.value = ""; // will be loaded from Firestore later
      txt.oninput=()=> {
        if(auth.currentUser) saveUserData(auth.currentUser.uid, txt._key, txt.value);
      };
      [drop,pick,app,ivy,ever,txt].forEach(el=>cell.appendChild(el));
      updateDay(cell);
      grid.appendChild(cell);
    }
    sec.appendChild(grid);
    cal.appendChild(sec);
  }
}

function createSelect(opts,def,key){
  const s=document.createElement("select"); s._key=key;
  s.innerHTML=opts.map(o=>`<option${o==""?' selected':''} value="${o}">${o||def}</option>`).join("");
  s.className=oClass(def);
  return s;
}
function createCheckbox(label,key){
  const l=document.createElement("label"); l.className="checkbox-label"; l._key=key;
  const c=document.createElement("input"); c.type="checkbox"; c.checked=false;
  l.appendChild(c); l.appendChild(document.createTextNode(" "+label));
  return l;
}
function oClass(str){return str.includes("Drop")?"select-caregiver":"select-appointment";}
function updateDay(cell){
  ["mother-dropoff","father-dropoff","mother-pickup","father-pickup"].forEach(c=>cell.classList.remove(c));
  const sel=cell.querySelectorAll("select");
  const d=sel[0].value, p=sel[1].value;
  if(d) cell.classList.add(`${d}-dropoff`);
  if(p) cell.classList.add(`${p}-pickup`);
  const a=sel[2].value;
  if(a) cell.classList.add("has-appointment"); else cell.classList.remove("has-appointment");
}

function buildSummary(){
  const tb=document.getElementById("summaryBody"); tb.innerHTML="";
