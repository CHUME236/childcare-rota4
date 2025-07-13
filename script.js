document.addEventListener("DOMContentLoaded", () => {
  buildCalendars();
  setupButtons();
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
      const wov=document.createElement("div"); wov.className="week-overlay"; wov.textContent=(wk%2? "Week 1":"Week 2"); cell.appendChild(wov);
      const hd=document.createElement("div"); hd.className="day-header"; hd.textContent=`${d} ${days[dow]}`; cell.appendChild(hd);
      const drop=createSelect(["","mother","father"],"--Drop‑off--",key+"_dropoff"), pick=createSelect(["","mother","father"],"--Pick‑up--",key+"_pickup");
      const app=createSelect(["","dentist","pe","party","swimming"],"--Appointment--",key+"_appointment");
      [drop,pick].forEach(sel => sel.onchange=()=>{ localStorage.setItem(sel._key,sel.value); updateDay(cell); });
      app.onchange=()=>{ localStorage.setItem(app._key,app.value); updateDay(cell); };
      const ivy=createCheckbox("Ivy",key+"_ivy"), ever=createCheckbox("Everly",key+"_everly");
      [ivy,ever].forEach(ch=>ch.querySelector("input").onchange=e=> localStorage.setItem(ch._key,e.target.checked));
      const txt=document.createElement("textarea"); txt.className="day-comment"; txt.placeholder="Add notes..."; txt.value=localStorage.getItem(key+"_comment")||"";
      txt.oninput=()=>localStorage.setItem(key+"_comment",txt.value);
      [drop,pick,app,ivy,ever,txt].forEach(el=>cell.appendChild(el));
      updateDay(cell);
      grid.appendChild(cell);
    }
    sec.appendChild(grid);
    cal.appendChild(sec);
  }
}

function createSelect(opts,def,key){
  const s=document.createElement("select"); s._key=key; s.innerHTML=opts.map(o=>`<option${o==""?' selected':''} value="${o}">${o||def}</option>`).join("");
  s.className=oClass(def); return s;
}
function createCheckbox(label,key){
  const l=document.createElement("label"); l.className="checkbox-label"; l._key=key;
  const c=document.createElement("input"); c.type="checkbox"; c.checked=localStorage.getItem(key)==="true";
  l.appendChild(c); l.appendChild(document.createTextNode(" "+label)); return l;
}
function oClass(str){return str.includes("Drop")?"select-caregiver":"select-appointment";}
function updateDay(cell){
  ["mother-dropoff","father-dropoff","mother-pickup","father-pickup"].forEach(c=>cell.classList.remove(c));
  if(cell.querySelector("select._key")){} // no-op
  const sel=cell.querySelectorAll("select");
  const d=sel[0].value, p=sel[1].value;
  if(d) cell.classList.add(`${d}-dropoff`);
  if(p) cell.classList.add(`${p}-pickup`);
  const a=sel[2].value;
  if(a) cell.classList.add("has-appointment"); else cell.classList.remove("has-appointment");
}

function buildSummary(){
  const tb=document.getElementById("summaryBody"); tb.innerHTML="";
  const fc=document.getElementById("filterCaregiver").value, ch=document.getElementById("filterChild").value;
  const months=[6,7,8,9,10,11], ym=2025, days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  for(let m of months){
    const di=new Date(ym,m+1,0).getDate();
    for(let d=1;d<=di;d++){
      const key=`${ym}-${m+1}-${d}`, date=new Date(ym,m,d);
      const drop=localStorage.getItem(key+"_dropoff")||"", pick=localStorage.getItem(key+"_pickup")||"",
            app=localStorage.getItem(key+"_appointment")||"", ivy=localStorage.getItem(key+"_ivy")==="true",
            ever=localStorage.getItem(key+"_everly")==="true", com=localStorage.getItem(key+"_comment")||"";
      if(fc!=="all"&&drop!==fc&&pick!==fc)continue;
      if(ch==="ivy"&&!ivy||ch==="everly"&&!ever)continue;
      const tr=document.createElement("tr");
      const cg=new Set([drop,pick].filter(Boolean));
      if(cg.size===1) tr.className=cg.has("mother")?"summary-mother-only":"summary-father-only";
      if(cg.size===2) tr.className="summary-both";
      tr.innerHTML=`
        <td>${ym}-${m+1}-${d}</td>
        <td>${days[date.getDay()]}</td>
        <td>${drop||"-"}</td>
        <td>${pick||"-"}</td>
        <td>${app||"-"}</td>
        <td>${ivy?"✓":""}</td>
        <td>${ever?"✓":""}</td>
        <td>${com}</td>`;
      tb.appendChild(tr);
    }
  }
}

function exportCSV(){
  buildSummary();
  const rows=[["Date","Day","Drop-off","Pick-up","Appointment","Ivy","Everly","Notes"]];
  document.querySelectorAll("#summaryBody tr").forEach(tr=>{
    const data=[...tr.querySelectorAll("td")].map(td=>td.textContent);
    rows.push(data);
  });
  const csv = rows.map(r=>r.map(c=>`"${c.replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"}), url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="childcare_summary.csv";a.click();
  URL.revokeObjectURL(url);
}
