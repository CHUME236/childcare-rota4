document.addEventListener("DOMContentLoaded", () => {
  buildCalendars();
});

function showCalendar() {
  document.getElementById("calendar").style.display = "block";
  document.getElementById("summary").style.display = "none";
  document.getElementById("filters").style.display = "none";
}

function showSummary() {
  document.getElementById("calendar").style.display = "none";
  document.getElementById("summary").style.display = "block";
  document.getElementById("filters").style.display = "flex";
  renderSummaryTable();
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
    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay + 6) % 7;

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
      if (selectAppointment.value) {
        cell.classList.add("has-appointment");
      }

      const comment = document.createElement("textarea");
      comment.className = "day-comment";
      comment.placeholder = "Notes...";
      comment.value = localStorage.getItem(currentDate + "_comment") || "";

      const checkboxLabel = document.createElement("label");
      checkboxLabel.className = "checkbox-label";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = localStorage.getItem(currentDate + "_checkbox") === "true";
      checkboxLabel.appendChild(checkbox);
      checkboxLabel.appendChild(document.createTextNode("Completed"));

      // Save data on change
      [selectDropoff, selectPickup, selectAppointment, comment, checkbox].forEach(input => {
        input.addEventListener("change", () => {
          localStorage.setItem(currentDate + "_dropoff", selectDropoff.value);
          localStorage.setItem(currentDate + "_pickup", selectPickup.value);
          localStorage.setItem(currentDate + "_appointment", selectAppointment.value);
          localStorage.setItem(currentDate + "_comment", comment.value);
          localStorage.setItem(currentDate + "_checkbox", checkbox.checked);
          updateDayStyles(cell, selectDropoff.value, selectPickup.value, selectAppointment.value);
        });
      });

      // Initial style update
      updateDayStyles(cell, selectDropoff.value, selectPickup.value, selectAppointment.value);

      cell.appendChild(header);
      cell.appendChild(selectDropoff);
      cell.appendChild(selectPickup);
      cell.appendChild(selectAppointment);
      cell.appendChild(comment);
      cell.appendChild(checkboxLabel);
      monthGrid.appendChild(cell);
    }

    section.appendChild(monthGrid);
    calendar.appendChild(section);
  }
}

function updateDayStyles(cell, dropoff, pickup, appointment) {
  cell.classList.remove("mother-dropoff", "father-dropoff", "mother-pickup", "father-pickup", "has-appointment");
  if (dropoff === "mother") cell.classList.add("mother-dropoff");
  if (dropoff === "father") cell.classList.add("father-dropoff");
  if (pickup === "mother") cell.classList.add("mother-pickup");
  if (pickup === "father") cell.classList.add("father-pickup");
  if (appointment) cell.classList.add("has-appointment");
}

function renderSummaryTable() {
  const tableBody = document.querySelector("#summary tbody");
  tableBody.innerHTML = "";
  const year = 2025;

  const caregiverFilter = document.getElementById("filter-caregiver").value;
  const childFilter = document.getElementById("filter-child").value;

  for (let month = 6; month <= 11; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = `${year}-${month + 1}-${day}`;
      const dropoff = localStorage.getItem(currentDate + "_dropoff") || "";
      const pickup = localStorage.getItem(currentDate + "_pickup") || "";
      const appointment = localStorage.getItem(currentDate + "_appointment") || "";
      const comment = localStorage.getItem(currentDate + "_comment") || "";
      const checkbox = localStorage.getItem(currentDate + "_checkbox") === "true";

      // Apply filters
      if (caregiverFilter && ![dropoff, pickup].includes(caregiverFilter)) continue;
      if (childFilter && !comment.toLowerCase().includes(childFilter.toLowerCase())) continue;

      const row = document.createElement("tr");

      // Row coloring
      const caregivers = [dropoff, pickup].filter(Boolean);
      if (caregivers.includes("mother") && caregivers.includes("father")) {
        row.className = "summary-both";
      } else if (caregivers.includes("mother")) {
        row.className = "summary-mother-only";
      } else if (caregivers.includes("father")) {
        row.className = "summary-father-only";
      }

      row.innerHTML = `
        <td>${currentDate}</td>
        <td>${dropoff}</td>
        <td>${pickup}</td>
        <td>${appointment}</td>
        <td>${comment}</td>
        <td>${checkbox ? "✔" : ""}</td>
      `;
      tableBody.appendChild(row);
    }
  }
}

document.getElementById("export-btn").addEventListener("click", exportSummaryToCSV);

function exportSummaryToCSV() {
  let csv = "Date,Drop-off,Pick-up,Appointment,Notes,Completed\n";
  document.querySelectorAll("#summary tbody tr").forEach(row => {
    const cols = Array.from(row.querySelectorAll("td")).map(td => `"${td.innerText.replace(/"/g, '""')}"`);
    csv += cols.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "childcare_summary.csv";
  a.click();
  URL.revokeObjectURL(url);
}
