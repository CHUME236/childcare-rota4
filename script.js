document.addEventListener("DOMContentLoaded", () => {
  buildCalendars();
  buildSummary();

  // Show calendar by default
  document.getElementById("calendar").style.display = "block";
  document.getElementById("summary").style.display = "none";
});

function buildCalendars() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";
  const year = 2025;
  const months = ["July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let month = 6; month <= 11; month++) {
    const section = document.createElement("section");
    const title = document.createElement("h2");
    title.textContent = `${months[month - 6]} ${year}`;
    section.appendChild(title);
    const monthGrid = document.createElement("div");
    monthGrid.className = "month-grid";
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const offset = (firstDay + 6) % 7; // Monday start
    for (let i = 0; i < offset; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "day empty";
      monthGrid.appendChild(emptyCell);
    }
    let weekCounter = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dow = (date.getDay() + 6) % 7;
      if (dow === 0 || day === 1) weekCounter++;
      const currentDate = `${year}-${month + 1}-${day}`;
      const cell = document.createElement("div");
      cell.className = "day";
      const weekOverlay = document.createElement("div");
      weekOverlay.className = "week-overlay";
      weekOverlay.textContent = weekCounter % 2 === 1 ? "Week 1" : "Week 2";
      cell.appendChild(weekOverlay);
      const header = document.createElement("div");
      header.className = "day-header";
      header.textContent = `${day} ${daysOfWeek[dow]}`;
      const selectDropoff = document.createElement("select");
      selectDropoff.className = "select-caregiver dropoff";
      selectDropoff.innerHTML = `
        <option value="">--Drop-off--</option>
        <option value="mother">Mother</option>
        <option value="father">Father</option>`;
      selectDropoff.value = localStorage.getItem(currentDate + "_dropoff") || "";
      const selectPickup = document.createElement("select");
      selectPickup.className = "select-caregiver pickup";
      selectPickup.innerHTML = `
        <option value="">--Pick-up--</option>
        <option value="mother">Mother</option>
        <option value="father">Father</option>`;
      selectPickup.value = localStorage.getItem(currentDate + "_pickup") || "";
      const selectAppointment = document.createElement("select");
      selectAppointment.className = "select-appointment";
      selectAppointment.innerHTML = `
        <option value="">--Appointment--</option>
        <option value="dentist">Dentist</option>
        <option value="pe">PE</option>
        <option value="party">Party</option>
        <option value="swimming">Swimming</option>`;
      selectAppointment.value = localStorage.getItem(currentDate + "_appointment") || "";
      const ivyFlag = document.createElement("label");
      ivyFlag.className = "checkbox-label";
      const ivyCheckbox = document.createElement("input");
      ivyCheckbox.type = "checkbox";
      ivyCheckbox.checked = localStorage.getItem(currentDate + "_ivy") === "true";
      ivyCheckbox.addEventListener("change", () =>
        localStorage.setItem(currentDate + "_ivy", ivyCheckbox.checked)
      );
      ivyFlag.appendChild(ivyCheckbox);
      ivyFlag.appendChild(document.createTextNode(" Ivy"));
      const everlyFlag = document.createElement("label");
      everlyFlag.className = "checkbox-label";
      const everlyCheckbox = document.createElement("input");
      everlyCheckbox.type = "checkbox";
      everlyCheckbox.checked = localStorage.getItem(currentDate + "_everly") === "true";
      everlyCheckbox.addEventListener("change", () =>
        localStorage.setItem(currentDate + "_everly", everlyCheckbox.checked)
      );
      everlyFlag.appendChild(everlyCheckbox);
      everlyFlag.appendChild(document.createTextNode(" Everly"));
      const commentBox = document.createElement("textarea");
      commentBox.className = "day-comment";
      commentBox.placeholder = "Add notes...";
      commentBox.value = localStorage.getItem(currentDate + "_comment") || "";
      commentBox.addEventListener("input", () =>
        localStorage.setItem(currentDate + "_comment", commentBox.value)
      );
      selectDropoff.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_dropoff", selectDropoff.value);
        updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
        buildSummary();
      });
      selectPickup.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_pickup", selectPickup.value);
        updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
        buildSummary();
      });
      selectAppointment.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_appointment", selectAppointment.value);
        updateAppointmentStyle(cell, selectAppointment.value);
        buildSummary();
      });
      ivyCheckbox.addEventListener("change", buildSummary);
      everlyCheckbox.addEventListener("change", buildSummary);
      commentBox.addEventListener("input", buildSummary);
      updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
      updateAppointmentStyle(cell, selectAppointment.value);
      cell.appendChild(header);
      cell.appendChild(selectDropoff);
      cell.appendChild(selectPickup);
      cell.appendChild(selectAppointment);
      cell.appendChild(ivyFlag);
      cell.appendChild(everlyFlag);
      cell.appendChild(commentBox);
      monthGrid.appendChild(cell);
    }
    section.appendChild(monthGrid);
    calendar.appendChild(section);
  }
}

function updateDayCellStyle(cell, dropoff, pickup) {
  cell.className = "day";
  if (dropoff) cell.classList.add(`${dropoff}-dropoff`);
  if (pickup) cell.classList.add(`${pickup}-pickup`);
}

function updateAppointmentStyle(cell, appointment) {
  if (appointment) {
    cell.classList.add("has-appointment");
  } else {
    cell.classList.remove("has-appointment");
  }
}

// ========== SUMMARY & FILTERING ==========

function buildSummary() {
  let summary = document.getElementById("summary");
  if (!summary) {
    summary = document.createElement("section");
    summary.id = "summary";
    summary.style.maxWidth = "1000px";
    summary.style.margin = "40px auto";
    document.body.appendChild(summary);
  }
  summary.innerHTML = `
    <h2>Summary</h2>
    <div style="margin-bottom: 15px;">
      <label for="filterCaregiver">Filter by Caregiver: </label>
      <select id="filterCaregiver">
        <option value="all">All</option>
        <option value="mother">Mother</option>
        <option value="father">Father</option>
      </select>
      &nbsp;&nbsp;&nbsp;
      <label for="filterChild">Filter by Child: </label>
      <select id="filterChild">
        <option value="all">All</option>
        <option value="ivy">Ivy</option>
        <option value="everly">Everly</option>
      </select>
      &nbsp;&nbsp;&nbsp;
      <button id="exportCsvBtn">Export CSV</button>
      &nbsp;&nbsp;&nbsp;
      <button id="showCalendarBtn">Show Calendar</button>
    </div>
    <table id="summaryTable" border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th>Date</th>
          <th>Day</th>
          <th>Drop-off</th>
          <th>Pick-up</th>
          <th>Appointment</th>
          <th>Ivy</th>
          <th>Everly</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  // Add event listeners for filters & buttons
  document.getElementById("filterCaregiver").addEventListener("change", filterSummary);
  document.getElementById("filterChild").addEventListener("change", filterSummary);
  document.getElementById("exportCsvBtn").addEventListener("click", exportSummaryToCSV);
  document.getElementById("showCalendarBtn").addEventListener("click", () => {
    document.getElementById("calendar").style.display = "block";
    document.getElementById("summary").style.display = "none";
  });

  populateSummaryTable();
}

function populateSummaryTable() {
  const tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";

  const year = 2025;
  const months = [6, 7, 8, 9, 10, 11]; // July to December (0-based months)
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  let rows = [];

  for (let month of months) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = `${year}-${month + 1}-${day}`;
      const dropoff = localStorage.getItem(currentDate + "_dropoff") || "";
      const pickup = localStorage.getItem(currentDate + "_pickup") || "";
      const appointment = localStorage.getItem(currentDate + "_appointment") || "";
      const ivy = localStorage.getItem(currentDate + "_ivy") === "true";
      const everly = localStorage.getItem(currentDate + "_everly") === "true";
      const comment = localStorage.getItem(currentDate + "_comment") || "";
      if (!dropoff && !pickup && !appointment && !ivy && !everly && !comment) {
        // skip empty days
        continue;
      }

      // Determine day of week text
      const dateObj = new Date(year, month, day);
      const dow = (dateObj.getDay() + 6) % 7;
      const dayText = `${day} ${daysOfWeek[dow]}`;

      rows.push({
        date: currentDate,
        dayText,
        dropoff,
        pickup,
        appointment,
        ivy,
        everly,
        comment,
      });
    }
  }

  // Save all rows for filtering
  window.summaryRows = rows;

  applySummaryFilters();
}

function filterSummary() {
  applySummaryFilters();
}

function applySummaryFilters() {
  const caregiverFilter = document.getElementById("filterCaregiver").value;
  const childFilter = document.getElementById("filterChild").value;

  const tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";

  let filteredRows = window.summaryRows.filter(row => {
    // Caregiver filter
    if (caregiverFilter === "mother") {
      if (row.dropoff !== "mother" && row.pickup !== "mother") return false;
    } else if (caregiverFilter === "father") {
      if (row.dropoff !== "father" && row.pickup !== "father") return false;
    }
    // Child filter
    if (childFilter === "ivy" && !row.ivy) return false;
    if (childFilter === "everly" && !row.everly) return false;
    return true;
  });

  // Build rows with highlighting
  filteredRows.forEach(row => {
    const tr = document.createElement("tr");

    // Highlight row background based on caregiver presence
    const caregivers = new Set();
    if (row.dropoff) caregivers.add(row.dropoff);
    if (row.pickup) caregivers.add(row.pickup);

    if (caregivers.size === 1) {
      if (caregivers.has("mother")) tr.style.backgroundColor = "#ffff99"; // Yellow
      else if (caregivers.has("father")) tr.style.backgroundColor = "#99ccff"; // Blue
    } else if (caregivers.size > 1) {
      tr.style.backgroundColor = "#ffccdd"; // Pink
    }

    tr.innerHTML = `
      <td>${row.date}</td>
      <td>${row.dayText}</td>
      <td>${capitalize(row.dropoff)}</td>
      <td>${capitalize(row.pickup)}</td>
      <td>${capitalize(row.appointment)}</td>
      <td>${row.ivy ? "Yes" : ""}</td>
      <td>${row.everly ? "Yes" : ""}</td>
      <td>${row.comment}</td>
    `;
    tbody.appendChild(tr);
  });

  // Show summary, hide calendar
  document.getElementById("summary").style.display = "block";
  document.getElementById("calendar").style.display = "none";
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function exportSummaryToCSV() {
  const caregiverFilter = document.getElementById("filterCaregiver").value;
  const childFilter = document.getElementById("filterChild").value;
  let filteredRows = window.summaryRows.filter(row => {
    if (caregiverFilter === "mother") {
      if (row.dropoff !== "mother" && row.pickup !== "mother") return false;
    } else if (caregiverFilter === "father") {
      if (row.dropoff !== "father" && row.pickup !== "father") return false;
    }
    if (childFilter === "ivy" && !row.ivy) return false;
    if (childFilter === "everly" && !row.everly) return false;
    return true;
  });

  if (filteredRows.length === 0) {
    alert("No data to export for current filters.");
    return;
  }

  let csvContent = "Date,Day,Drop-off,Pick-up,Appointment,Ivy,Everly,Notes\n";
  filteredRows.forEach(row => {
    const rowArray = [
      row.date,
      row.dayText,
      capitalize(row.dropoff),
      capitalize(row.pickup),
      capitalize(row.appointment),
      row.ivy ? "Yes" : "",
      row.everly ? "Yes" : "",
      `"${row.comment.replace(/"/g, '""')}"`
    ];
    csvContent += rowArray.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "childcare_summary.csv");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
