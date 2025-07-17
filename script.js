let currentDate = new Date();
const calendar = document.getElementById("calendar");
const summary = document.getElementById("summary");
const summaryBody = document.getElementById("summaryBody");
const showCalendarBtn = document.getElementById("showCalendarBtn");
const showSummaryBtn = document.getElementById("showSummaryBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const logoutBtn = document.getElementById("logoutBtn");
const filterCaregiver = document.getElementById("filterCaregiver");
const filterChild = document.getElementById("filterChild");

// In-memory storage of day data
let calendarData = {};

function getDateKey(date) {
  return date.toISOString().split("T")[0];
}

function generateCalendar(year, month) {
  calendar.innerHTML = "";

  const monthNavigation = document.createElement("div");
  monthNavigation.id = "monthNavigation";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← Previous";
  prevBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next →";
  nextBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  };

  const monthLabel = document.createElement("span");
  monthLabel.id = "monthLabel";
  monthLabel.textContent = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  monthNavigation.appendChild(prevBtn);
  monthNavigation.appendChild(monthLabel);
  monthNavigation.appendChild(nextBtn);
  calendar.appendChild(monthNavigation);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const grid = document.createElement("div");
  grid.className = "month-grid";

  daysOfWeek.forEach(day => {
    const header = document.createElement("div");
    header.className = "day-header";
    header.textContent = day;
    grid.appendChild(header);
  });

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day empty";
    grid.appendChild(emptyCell);
  }

  for (let date = 1; date <= lastDate; date++) {
    const cell = document.createElement("div");
    const current = new Date(year, month, date);
    const key = getDateKey(current);
    cell.className = "day";

    const dateLabel = document.createElement("div");
    dateLabel.className = "date-number";
    dateLabel.textContent = `${date}${getOrdinalSuffix(date)}`;
    cell.appendChild(dateLabel);

    const dropoff = createSelect(["", "mother", "father"], "Drop-off", selected => {
      updateData(key, "dropoff", selected);
      updateDayClasses(cell, key);
    }, calendarData[key]?.dropoff);
    cell.appendChild(dropoff);

    const pickup = createSelect(["", "mother", "father"], "Pick-up", selected => {
      updateData(key, "pickup", selected);
      updateDayClasses(cell, key);
    }, calendarData[key]?.pickup);
    cell.appendChild(pickup);

    const appointment = document.createElement("label");
    appointment.innerHTML = `<input type="checkbox" ${calendarData[key]?.appointment ? "checked" : ""}> Appointment`;
    appointment.querySelector("input").onchange = (e) => updateData(key, "appointment", e.target.checked);
    cell.appendChild(appointment);

    const ivy = document.createElement("label");
    ivy.innerHTML = `<input type="checkbox" ${calendarData[key]?.ivy ? "checked" : ""}> Ivy`;
    ivy.querySelector("input").onchange = (e) => updateData(key, "ivy", e.target.checked);
    cell.appendChild(ivy);

    const everly = document.createElement("label");
    everly.innerHTML = `<input type="checkbox" ${calendarData[key]?.everly ? "checked" : ""}> Everly`;
    everly.querySelector("input").onchange = (e) => updateData(key, "everly", e.target.checked);
    cell.appendChild(everly);

    const notes = document.createElement("textarea");
    notes.placeholder = "Notes";
    notes.value = calendarData[key]?.notes || "";
    notes.oninput = (e) => updateData(key, "notes", e.target.value);
    cell.appendChild(notes);

    updateDayClasses(cell, key);
    grid.appendChild(cell);
  }

  calendar.appendChild(grid);
}

function createSelect(options, label, onChange, selectedValue) {
  const select = document.createElement("select");
  options.forEach(option => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option ? option[0].toUpperCase() + option.slice(1) : `Select ${label}`;
    if (option === selectedValue) opt.selected = true;
    select.appendChild(opt);
  });
  select.onchange = (e) => onChange(e.target.value);
  return select;
}

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function updateData(dateKey, field, value) {
  if (!calendarData[dateKey]) calendarData[dateKey] = {};
  calendarData[dateKey][field] = value;
  updateSummary();
}

function updateDayClasses(cell, key) {
  cell.classList.remove("mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup");

  const data = calendarData[key];
  if (data?.dropoff === "mother") cell.classList.add("mother-dropoff");
  else if (data?.dropoff === "father") cell.classList.add("father-dropoff");

  if (data?.pickup === "mother") cell.classList.add("mother-pickup");
  else if (data?.pickup === "father") cell.classList.add("father-pickup");
}

function updateSummary() {
  summaryBody.innerHTML = "";
  const keys = Object.keys(calendarData).sort();

  keys.forEach(dateKey => {
    const entry = calendarData[dateKey];
    const row = document.createElement("tr");

    const date = new Date(dateKey);
    row.innerHTML = `
      <td>${dateKey}</td>
      <td>${date.toLocaleDateString("en-US", { weekday: "short" })}</td>
      <td>${entry.dropoff || ""}</td>
      <td>${entry.pickup || ""}</td>
      <td>${entry.appointment ? "✔" : ""}</td>
      <td>${entry.ivy ? "✔" : ""}</td>
      <td>${entry.everly ? "✔" : ""}</td>
      <td>${entry.notes || ""}</td>
    `;
    summaryBody.appendChild(row);
  });
}

// View toggles
showCalendarBtn.onclick = () => {
  calendar.style.display = "";
  summary.style.display = "none";
};

showSummaryBtn.onclick = () => {
  calendar.style.display = "none";
  summary.style.display = "";
  updateSummary();
};

exportCsvBtn.onclick = () => {
  const rows = [["Date", "Weekday", "Drop-off", "Pick-up", "Appointment", "Ivy", "Everly", "Notes"]];
  Object.keys(calendarData).forEach(dateKey => {
    const d = calendarData[dateKey];
    const date = new Date(dateKey);
    rows.push([
      dateKey,
      date.toLocaleDateString("en-US", { weekday: "short" }),
      d.dropoff || "",
      d.pickup || "",
      d.appointment ? "Yes" : "",
      d.ivy ? "Yes" : "",
      d.everly ? "Yes" : "",
      d.notes || ""
    ]);
  });

  const csvContent = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "childcare_rota.csv";
  link.click();
};

logoutBtn.onclick = () => {
  // Placeholder logout logic
  alert("Logging out...");
};

// Initial render
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  generateCalendar(year, month);
}
renderCalendar();
