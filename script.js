document.addEventListener("DOMContentLoaded", () => {
  buildCalendars();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById("showCalendarBtn").addEventListener("click", () => {
    document.getElementById("calendar").style.display = "flex";
    document.getElementById("summary").style.display = "none";
  });

  document.getElementById("showSummaryBtn").addEventListener("click", () => {
    document.getElementById("calendar").style.display = "none";
    document.getElementById("summary").style.display = "block";
    buildSummary();
  });

  document.getElementById("exportCsvBtn").addEventListener("click", exportSummaryToCSV);

  document.getElementById("filterCaregiver").addEventListener("change", buildSummary);
  document.getElementById("filterChild").addEventListener("change", buildSummary);
}

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
    // Adjust for Monday-starting week
    const offset = (firstDay + 6) % 7;

    for (let i = 0; i < offset; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "day empty";
      monthGrid.appendChild(emptyCell);
    }

    let weekCounter = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dow = (date.getDay() + 6) % 7; // Convert Sunday-start to Monday-start
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

      // Ivy checkbox
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

      // Everly checkbox
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

      // Comment box
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
      });

      selectPickup.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_pickup", selectPickup.value);
        updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
      });

      selectAppointment.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_appointment", selectAppointment.value);
        updateAppointmentStyle(cell, selectAppointment.value);
      });

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

// Build Summary table
function buildSummary() {
  const tbody = document.getElementById("summaryBody");
  tbody.innerHTML = "";

  const year = 2025;
  const months = ["July", "August", "September", "October", "November", "December"];

  const filterCaregiver = document.getElementById("filterCaregiver").value;
  const filterChild = document.getElementById("filterChild").value;

  for (let monthIndex = 6; monthIndex <= 11; monthIndex++) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${monthIndex + 1}-${day}`;

      const dropoff = localStorage.getItem(dateStr + "_dropoff") || "";
      const pickup = localStorage.getItem(dateStr + "_pickup") || "";
      const appointment = localStorage.getItem(dateStr + "_appointment") || "";
      const ivy = localStorage.getItem(dateStr + "_ivy") === "true";
      const everly = localStorage.getItem(dateStr + "_everly") === "true";
      const comment = localStorage.getItem(dateStr + "_comment") || "";

      // Filter by caregiver
      if (filterCaregiver !== "all") {
        if (dropoff !== filterCaregiver && pickup !== filterCaregiver) {
          continue; // skip this row
        }
      }

      // Filter by child
      if (filterChild !== "all") {
        if (filterChild === "ivy" && !ivy) continue;
        if (filterChild === "everly" && !everly) continue;
      }

      const caregivers = [];
      if (dropoff) caregivers.push(`Drop-off: ${capitalize(dropoff)}`);
      if (pickup) caregivers.push(`Pick-up: ${capitalize(pickup)}`);

      const children = [];
      if (ivy) children.push("Ivy");
      if (everly) children.push("Everly");

      // Create table row
      const tr = document.createElement("tr");

      // Highlight row based on caregiver involvement
      const involvedCaregivers = new Set();
      if (dropoff) involvedCaregivers.add(dropoff);
      if (pickup) involvedCaregivers.add(pickup);

      if (involvedCaregivers.size === 1) {
        if (involvedCaregivers.has("mother")) {
          tr.classList.add("summary-mother-only");
        } else if (involvedCaregivers.has("father")) {
          tr.classList.add("summary-father-only");
        }
      } else if (involvedCaregivers.size === 2) {
        tr.classList.add("summary-both");
      }

      tr.innerHTML = `
        <td>${day}</td>
        <td>${months[monthIndex - 6]}</td>
        <td>${caregivers.join(", ") || "-"}</td>
        <td>${appointment || "-"}</td>
        <td>${children.join(", ") || "-"}</td>
        <td>${escapeHtml(comment)}</td>
      `;

      tbody.appendChild(tr);
    }
  }
}

// Capitalize helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Escape HTML for safety in comments
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Export Summary table to CSV
function exportSummaryToCSV() {
  const filterCaregiver = document.getElementById("filterCaregiver").value;
  const filterChild = document.getElementById("filterChild").value;

  let csvContent = "Date,Month,Caregivers,Appointment,Children,Notes\n";

  const year = 2025;
  const months = ["July", "August", "September", "October", "November", "December"];

  for (let monthIndex = 6; monthIndex <= 11; monthIndex++) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let day = 1;
