function renderCalendar(month, year) {
  calendarEl.innerHTML = "";

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const grid = document.createElement("div");
  grid.className = "month-grid";

  // Add headers
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayNames.forEach(day => {
    const header = document.createElement("div");
    header.className = "day-header";
    header.textContent = day;
    grid.appendChild(header);
  });

  const offset = firstWeekday;

  for (let i = 0; i < offset; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day empty";
    grid.appendChild(emptyCell);
  }

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const cell = document.createElement("div");
    cell.className = "day";

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const dayData = {
      dropoff: calendarData[dateStr + "_dropoff"] || "",
      pickup: calendarData[dateStr + "_pickup"] || "",
      appointment: calendarData[dateStr + "_appointment"] || "",
      ivy: calendarData[dateStr + "_ivy"] || false,
      everly: calendarData[dateStr + "_everly"] || false,
      comment: calendarData[dateStr + "_comment"] || ""
    };

    const dateNumber = document.createElement("div");
    dateNumber.className = "date-number";
    dateNumber.textContent = dayNum;
    cell.appendChild(dateNumber);

    const dropoff = createSelect(["", "mother", "father"], "--Drop-off--", dateStr + "_dropoff", dayData.dropoff);
    const pickup = createSelect(["", "mother", "father"], "--Pick-up--", dateStr + "_pickup", dayData.pickup);
    const appointment = createSelect(["", "dentist", "pe", "party", "swimming"], "--Appointment--", dateStr + "_appointment", dayData.appointment);

    const ivy = createCheckbox("Ivy", dateStr + "_ivy", dayData.ivy);
    const everly = createCheckbox("Everly", dateStr + "_everly", dayData.everly);

    const notes = document.createElement("textarea");
    notes.placeholder = "Notes...";
    notes.value = dayData.comment;
    notes.oninput = async () => {
      calendarData[dateStr + "_comment"] = notes.value;
      await saveCalendarData();
    };

    [dropoff, pickup, appointment, ivy, everly, notes].forEach(el => cell.appendChild(el));
    updateDayStyle(cell, dropoff.value, pickup.value);

    grid.appendChild(cell);
  }

  calendarEl.appendChild(grid);
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
