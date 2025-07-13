document.addEventListener("DOMContentLoaded", () => {
  // Initialize
  setupAuth();
  setupButtons();
  checkLogin();
});

// --- AUTH & USER SESSION MANAGEMENT ---

const API_BASE = "http://localhost:3000"; // Change if needed

function setupAuth() {
  // Show signup/login toggle
  document.getElementById("showSignup").onclick = e => {
    e.preventDefault();
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
    clearAuthErrors();
  };
  document.getElementById("showLogin").onclick = e => {
    e.preventDefault();
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
    clearAuthErrors();
  };

  // Signup
  document.getElementById("signupBtn").onclick = async () => {
    clearAuthErrors();
    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value;
    if(!username || !password) {
      showSignupError("Please enter username and password");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username, password})
      });
      const data = await res.json();
      if(!res.ok) {
        showSignupError(data.error || "Signup failed");
      } else {
        alert("Signup successful! Please login.");
        document.getElementById("signupForm").style.display = "none";
        document.getElementById("loginForm").style.display = "block";
      }
    } catch(e) {
      showSignupError("Network error");
    }
  };

  // Login
  document.getElementById("loginBtn").onclick = async () => {
    clearAuthErrors();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    if(!username || !password) {
      showLoginError("Please enter username and password");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username, password})
      });
      const data = await res.json();
      if(!res.ok) {
        showLoginError(data.error || "Login failed");
      } else {
        // Save token
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", username);
        clearAuthErrors();
        checkLogin();
      }
    } catch(e) {
      showLoginError("Network error");
    }
  };

  // Logout
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    location.reload();
  };
}

function showLoginError(msg) {
  document.getElementById("loginError").textContent = msg;
}
function showSignupError(msg) {
  document.getElementById("signupError").textContent = msg;
}
function clearAuthErrors() {
  document.getElementById("loginError").textContent = "";
  document.getElementById("signupError").textContent = "";
}

// Check if logged in, update UI accordingly
function checkLogin() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if(token && username) {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("userInfo").style.display = "block";
    document.getElementById("currentUser").textContent = username;
    document.getElementById("appButtons").style.display = "block";
    document.getElementById("legend").style.display = "flex";
    // Build calendar on login
    buildCalendars();
    toggle("calendar");
  } else {
    document.getElementById("authSection").style.display = "block";
    document.getElementById("userInfo").style.display = "none";
    document.getElementById("appButtons").style.display = "none";
    document.getElementById("legend").style.display = "none";
    toggle(null); // Hide calendar and summary
  }
}

// --- BUTTONS SETUP ---

function setupButtons() {
  document.getElementById("showCalendarBtn").onclick = () => toggle("calendar");
  document.getElementById("showSummaryBtn").onclick = () => { toggle("summary"); buildSummary(); };
  document.getElementById("exportCsvBtn").onclick = exportCSV;
  document.getElementById("filterCaregiver").onchange = buildSummary;
  document.getElementById("filterChild").onchange = buildSummary;

  // Save/load server buttons
  document.getElementById("saveDataBtn").onclick = saveDataToServer;
  document.getElementById("loadDataBtn").onclick = loadDataFromServer;
}

function toggle(id) {
  document.getElementById("calendar").style.display = id=="calendar"?"flex":"none";
  document.getElementById("summary").style.display = id=="summary"?"block":"none";
}

// --- CALENDAR BUILDING & UPDATING ---

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
      const drop=createSelect(["","mother","father"],"--Drop‑off--",key+"_drop
