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
    section.className = "month-section";

    const title = document.createElement("h2");
    title.textContent = `${months[month - 6]} ${year}`;
    section.appendChild(title);

    const monthGrid = document.createElement("div");
    monthGrid.className = "month-grid";

    // Add days of week header
    daysOfWeek.forEach(dow => {
      const headerCell = document.createElement("div");
      headerCell.className = "day-header-cell";
      headerCell.textContent = dow;
      monthGrid.appendChild(headerCell);
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const offset = (firstDay + 6) % 7; // convert Sunday=0 to Monday=0

    // Add empty cells for days before first day
    for (let i = 0; i < offset; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "day empty";
      monthGrid.appendChild(emptyCell);
    }

    // Week counter for Week 1/Week 2 overlay
    let weekCounter = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dow = (dateObj.getDay() + 6) % 7; // Monday=0...Sunday=6

      // Increment week counter on Mondays
      if (dow === 0) weekCounter++;

      const currentDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const cell = document.createElement("div");
      cell.className = "day";

      // Week overlay
      const weekOverlay = document.createElement("div");
      weekOverlay.className = "week-overlay";
      weekOverlay.textContent = (weekCounter % 2 === 1) ? "Week 1" : "Week 2";
      cell.appendChild(weekOverlay);

      // Day header
      const header = document.createElement("div");
      header.className = "day-header";
      header.textContent = `${day} ${daysOfWeek[dow]}`;
      cell.appendChild(header);

      // Drop-off select
      const selectDropoff = document.createElement("select");
      selectDropoff.className = "select-caregiver dropoff";
      selectDropoff.innerHTML = `
        <option value="">--Drop-off--</option>
        <option value="mother">Mother</option>
        <option value="father">Father</option>
      `;
      selectDropoff.value = localStorage.getItem(currentDate + "_dropoff") || "";
      selectDropoff.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_dropoff", selectDropoff.value);
        updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
      });
      cell.appendChild(selectDropoff);

      // Pick-up select
      const selectPickup = document.createElement("select");
      selectPickup.className = "select-caregiver pickup";
      selectPickup.innerHTML = `
        <option value="">--Pick-up--</option>
        <option value="mother">Mother</option>
        <option value="father">Father</option>
      `;
      selectPickup.value = localStorage.getItem(currentDate + "_pickup") || "";
      selectPickup.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_pickup", selectPickup.value);
        updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
      });
      cell.appendChild(selectPickup);

      // Appointment select
      const selectAppointment = document.createElement("select");
      selectAppointment.className = "select-appointment";
      selectAppointment.innerHTML = `
        <option value="">--Appointment--</option>
        <option value="dentist">Dentist</option>
        <option value="pe">PE</option>
        <option value="party">Party</option>
        <option value="swimming">Swimming</option>
      `;
      selectAppointment.value = localStorage.getItem(currentDate + "_appointment") || "";
      selectAppointment.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_appointment", selectAppointment.value);
        updateAppointmentStyle(cell, selectAppointment.value);
      });
      cell.appendChild(selectAppointment);

      // Ivy checkbox
      const ivyFlag = document.createElement("label");
      ivyFlag.className = "checkbox-label";
      const ivyCheckbox = document.createElement("input");
      ivyCheckbox.type = "checkbox";
      ivyCheckbox.checked = localStorage.getItem(currentDate + "_ivy") === "true";
      ivyCheckbox.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_ivy", ivyCheckbox.checked);
      });
      ivyFlag.appendChild(ivyCheckbox);
      ivyFlag.appendChild(document.createTextNode(" Ivy"));
      cell.appendChild(ivyFlag);

      // Everly checkbox
      const everlyFlag = document.createElement("label");
      everlyFlag.className = "checkbox-label";
      const everlyCheckbox = document.createElement("input");
      everlyCheckbox.type = "checkbox";
      everlyCheckbox.checked = localStorage.getItem(currentDate + "_everly") === "true";
      everlyCheckbox.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_everly", everlyCheckbox.checked);
      });
      everlyFlag.appendChild(everlyCheckbox);
      everlyFlag.appendChild(document.createTextNode(" Everly"));
      cell.appendChild(everlyFlag);

      // Comment box
      const commentBox = document.createElement("textarea");
      commentBox.className = "day-comment";
      commentBox.placeholder = "Add notes...";
      commentBox.value = localStorage.getItem(currentDate + "_comment") || "";
      commentBox.addEventListener("input", () => {
        localStorage.setItem(currentDate + "_comment", commentBox.value);
      });
      cell.appendChild(commentBox);

      updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
      updateAppointmentStyle(cell, selectAppointment.value);

      monthGrid.appendChild(cell);
    }

    section.appendChild(monthGrid);
    calendar.appendChild(section);
  }
}

function updateDayCellStyle(cell, dropoff, pickup) {
  cell.classList.remove("mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup");
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
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const dropoff = localStorage.getItem(dateStr + "_dropoff") || "";
      const pickup = localStorage.getItem(dateStr + "_pickup") || "";
      const appointment = localStorage.getItem(dateStr + "_appointment") || "";
      const ivy = localStorage.getItem(dateStr + "_ivy") === "true";
      const everly = localStorage.getItem(dateStr + "_everly") === "true";
      const comment = localStorage.getItem(dateStr + "_comment") || "";

      // Filter by caregiver
      if (filterCaregiver !== "all") {
        if (dropoff !== filterCaregiver && pickup !== filterCaregiver) {
          continue;
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

      const tr = document.createElement("tr");

      // Highlight summary row based on caregivers
      const involvedCaregivers = new Set();
      if (dropoff) involvedCaregivers.add(dropoff);
      if (pickup) involvedCaregivers.add(pickup);

      tr.classList.remove("summary-mother-only", "summary-father-only", "summary-both");
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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function exportSummaryToCSV() {
  const filterCaregiver = document.getElementById("filterCaregiver").value;
  const filterChild = document.getElementById("filterChild").value;

  const year = 2025;
  const months = ["July", "August", "September", "October", "November", "December"];
  let csvContent = "Date,Month,Caregivers,Appointment,Children,Notes\n";

  for (let monthIndex = 6; monthIndex <= 11; monthIndex++) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const dropoff = localStorage.getItem(dateStr + "_dropoff") || "";
      const pickup = localStorage.getItem(dateStr + "_pickup") || "";
      const appointment = localStorage.getItem(dateStr + "_appointment") || "";
      const ivy = localStorage.getItem(dateStr + "_ivy") === "true";
      const everly = localStorage.getItem(dateStr + "_everly") === "true";
      const comment = localStorage.getItem(dateStr + "_comment") || "";

      // Apply filters
      if (filterCaregiver !== "all") {
        if (dropoff !== filterCaregiver && pickup !== filterCaregiver) {
          continue;
        }
      }
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

      const row = [
        day,
        months[monthIndex - 6],
        caregivers.join(" / ") || "-",
        appointment || "-",
        children.join(" / ") || "-",
        `"${comment.replace(/"/g, '""')}"`
      ];
      csvContent += row.join(",") + "\n";
    }
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "summary.csv";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
