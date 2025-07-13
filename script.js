// Firebase v9 modular import (you provided this style)
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, onValue } from "firebase/database";

// your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC4MhIUUWhnhF-UdqUkZqg_WeiSN0jUjx8",
  authDomain: "childcare-rota.firebaseapp.com",
  projectId: "childcare-rota",
  storageBucket: "childcare-rota.firebasestorage.app",
  messagingSenderId: "884910967236",
  appId: "1:884910967236:web:e6434fef7306bb0be67c91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✨ The rest of your application logic follows below (identical structure)

const year = 2025, monthsArr = ["July","August","September","October","November","December"],
      daysArr = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      daysFull = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

document.addEventListener("DOMContentLoaded", () => {
  buildCalendars();
  setupUI();
  buildSummary();
});

function setupUI(){
  document.getElementById("showCalendarBtn").onclick = ()=>toggle("calendar");
  document.getElementById("showSummaryBtn").onclick = ()=>{toggle("summary"); buildSummary();}
  document.getElementById("exportCsvBtn").onclick = exportCSV;
  document.getElementById("filterCaregiver").onchange = buildSummary;
  document.getElementById("filterChild").onchange = buildSummary;
}

function toggle(id){
  document.getElementById("calendar").style.display = id=="calendar"?"flex":"none";
  document.getElementById("summary").style.display = id=="summary"?"block":"none";
}

async function buildCalendars(){
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";
  for(let m=6;m<=11;m++){
    const sec = document.createElement("section");
    const title = document.createElement("h2");
    title.textContent = `${monthsArr[m-6]} ${year}`;
    sec.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "month-grid";
    const daysInMonth = new Date(year, m+1,0).getDate();
    const start = (new Date(year,m,1).getDay() +6)%7;
    for(let i=0;i<start;i++){
      const e = document.createElement("div");
      e.className = "day empty";
      grid.appendChild(e);
    }
    let wk=0;
    for(let d=1;d<=daysInMonth;d++){
      const dow = (new Date(year,m,d).getDay()+6)%7;
      if(dow===0||d===1) wk++;
      const key = `${year}-${m+1}-${d}`;
      const cell = createDayCell(m,d, dow, wk, key);
      grid.appendChild(cell);
      await loadFromFirebase(key, cell);
    }
    sec.appendChild(grid);
    cal.appendChild(sec);
  }
}

function createDayCell(month, day, dow, wk, key){
  const cell = document.createElement("div");
  cell.className = "day";

  const wo = document.createElement("div");
  wo.className = "week-overlay";
  wo.textContent = wk%2 ? "Week 1" : "Week 2";
  cell.appendChild(wo);

  const hd = document.createElement("div");
  hd.className = "day-header";
  hd.textContent = `${day} ${daysArr[dow]}`;
  cell.appendChild(hd);

  const drop = createSelect(["","mother","father"], "--Drop‑off--", key+"_dropoff");
  const pick = createSelect(["","mother","father"], "--Pick‑up--", key+"_pickup");
  const app  = createSelect(["","dentist","pe","party","swimming"], "--Appointment--", key+"_appointment");
  const ivy  = createCheckbox("Ivy", key+"_ivy");
  const eve  = createCheckbox("Everly", key+"_everly");

  const txt = document.createElement("textarea");
  txt.className = "day-comment";
  txt.placeholder = "Add notes...";
  txt.oninput = ()=> syncField(key+"_comment", txt.value);

  [drop,pick,app,ivy,eve,txt].forEach(el=>cell.appendChild(el));
  return cell;
}

function createSelect(opts, def, field){
  const s = document.createElement("select");
  s.dataset.field = field;
  opts.unshift(def);
  s.innerHTML = opts.map(o=>`<option value="${o==def? '' : o}">${o}</option>`).join("");
  s.onchange = ()=> syncField(field, s.value);
  return s;
}

function createCheckbox(label, field){
  const lbl = document.createElement("label");
  lbl.className = "checkbox-label";
  lbl.textContent = " "+label;
  const cb = document.createElement("input");
  cb.type = "checkbox";
  lbl.prepend(cb);
  cb.onchange = ()=> syncField(field, cb.checked);
  lbl.dataset.field = field;
  return lbl;
}

function syncField(field, val){
  set(ref(db, "calendar/" + field), val);
}

async function loadFromFirebase(key, cell){
  const snapshot = await get(ref(db, "calendar"));
  const data = snapshot.val() || {};
  for(const el of cell.querySelectorAll("[data-field]")){
    const f = el.dataset.field;
    const v = data[f];
    if(el.tagName=="SELECT") el.value = v || "";
    if(el.tagName=="LABEL") el.querySelector("input").checked = v===true;
  }
  const txt = cell.querySelector(".day-comment");
  const cm = data[key+"_comment"] || "";
  if(txt) txt.value = cm;

  updateDayStyle(cell);
}

function updateDayStyle(cell){
  ["mother-dropoff","father-dropoff","mother-pickup","father-pickup"].forEach(c=>cell.classList.remove(c));
  const s = cell.querySelectorAll("select");
  if(s[0].value) cell.classList.add(s[0].value+"-dropoff");
  if(s[1].value) cell.classList.add(s[1].value+"-pickup");
  if(s[2].value) cell.classList.toggle("has-appointment", !!s[2].value);
}

async function buildSummary(){
  const tb = document.getElementById("summaryBody");
  tb.innerHTML = "";
  const fc = document.getElementById("filterCaregiver").value;
  const ch = document.getElementById("filterChild").value;
  const snapshot = await get(ref(db, "calendar"));
  const data = snapshot.val()||{};

  for(let m=6;m<=11;m++){
    const di = new Date(year,m+1,0).getDate();
    for(let d=1;d<=di;d++){
      const keyBase = `${year}-${m+1}-${d}`;
      const drop = data[keyBase+"_dropoff"]||"";
      const pick = data[keyBase+"_pickup"]||"";
      const app = data[keyBase+"_appointment"]||"";
      const ivy = data[keyBase+"_ivy"];
      const eve = data[keyBase+"_everly"];
      const cm = data[keyBase+"_comment"]||"";

      if(fc!="all" && drop!=fc && pick!=fc) continue;
      if(ch=="ivy" && !ivy) continue;
      if(ch=="everly" && !eve) continue;

      const tr = document.createElement("tr");
      const cg = new Set([drop,pick].filter(Boolean));
      if(cg.size==1) tr.className = cg.has("mother")?"summary-mother-only":"summary-father-only";
      else if(cg.size==2) tr.className = "summary-both";

      tr.innerHTML = `
        <td>${keyBase}</td>
        <td>${daysFull[new Date(year,m,d).getDay()]}</td>
        <td>${drop}</td><td>${pick}</td><td>${app}</td>
        <td>${ivy?"✓":""}</td><td>${eve?"✓":""}</td><td>${cm}</td>`;
      tb.appendChild(tr);
    }
  }
}

function exportCSV(){
  const rows=[
    ["Date","Day","Drop‑off","Pick‑up","Appointment","Ivy","Everly","Notes"]
  ];
  document.querySelectorAll("#summaryBody tr").forEach(tr=>{
    const cols = [...tr.children].map(td=> `"${td.textContent.replace(/"/g,'""')}"`);
    rows.push(cols);
  });

  const csv = rows.map(r=>r.join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "childcare_summary.csv";
  a.click();
  URL.revokeObjectURL(url);
}
