document.addEventListener("DOMContentLoaded", buildCalendars);

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

function showSummary() {
  const calendarDiv = document.getElementById("calendar");
  const summaryDiv = document.getElementById("summary");
  calendarDiv.style.display = "none";
  summaryDiv.style.display = "block";
  summaryDiv.innerHTML = "";

  // Filters
  const filterDiv = document.createElement("div");
  filterDiv.innerHTML = `
    <label><input type="checkbox" id="filter-ivy" checked /> Ivy</label>
    <label><input type="checkbox" id="filter-everly" checked /> Everly</label>
    <button onclick="downloadCSV()">Export CSV</button>
    <button onclick="backToCalendar()">Back to Calendar</button>
  `;
  summaryDiv.appendChild(filterDiv);

  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Drop-off</th>
        <th>Pick-up</th>
        <th>Appointment</th>
        <th>Ivy</th>
        <th>Everly</th>
        <th>Comment</th>
      </tr>
    </thead>
  `;
  table.appendChild(tbody);
  summaryDiv.appendChild(table);

  const year = 2025;
  const rows = [];

  for (let month = 6; month <= 11; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month + 1}-${day}`;
      const dropoff = localStorage.getItem(dateStr + "_dropoff") || "";
      const pickup = localStorage.getItem(dateStr + "_pickup") || "";
      const appointment = localStorage.getItem(dateStr + "_appointment") || "";
      const ivy = localStorage.getItem(dateStr + "_ivy") === "true";
      const everly = localStorage.getItem(dateStr + "_everly") === "true";
      const comment = localStorage.getItem(dateStr + "_comment") || "";

      if (dropoff || pickup || appointment || ivy || everly || comment) {
        rows.push({ dateStr, dropoff, pickup, appointment, ivy, everly, comment });
      }
    }
  }

  const renderTable = () => {
    tbody.innerHTML = "";
    const showIvy = document.getElementById("filter-ivy").checked;
    const showEverly = document.getElementById("filter-everly").checked;

    for (const row of rows) {
      if ((row.ivy && showIvy) || (row.everly && showEverly) || (!row.ivy && !row.everly)) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.dateStr}</td>
          <td>${row.dropoff}</td>
          <td>${row.pickup}</td>
          <td>${row.appointment}</td>
          <td>${row.ivy ? "✅" : ""}</td>
          <td>${row.everly ? "✅" : ""}</td>
          <td>${row.comment}</td>
        `;
        tbody.appendChild(tr);
      }
    }
  };

  renderTable();

  document.getElementById("filter-ivy").addEventListener("change", renderTable);
  document.getElementById("filter-everly").addEventListener("change", renderTable);
}

function backToCalendar() {
  document.getElementById("calendar").style.display = "block";
  document.getElementById("summary").style.display = "none";
}

function downloadCSV() {
  const rows = [["Date", "Drop-off", "Pick-up", "Appointment", "Ivy", "Everly", "Comment"]];
  const year = 2025;

  for (let month = 6; month <= 11; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month + 1}-${day}`;
      const dropoff = localStorage.getItem(dateStr + "_dropoff") || "";
      const pickup = localStorage.getItem(dateStr + "_pickup") || "";
      const appointment = localStorage.getItem(dateStr + "_appointment") || "";
      const ivy = localStorage.getItem(dateStr + "_ivy") === "true" ? "Yes" : "";
      const everly = localStorage.getItem(dateStr + "_everly") === "true" ? "Yes" : "";
      const comment = localStorage.getItem(dateStr + "_comment") || "";

      if (dropoff || pickup || appointment || ivy || everly || comment) {
        rows.push([dateStr, dropoff, pickup, appointment, ivy, everly, comment]);
      }
    }
  }

  const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.setAttribute("href", URL.createObjectURL(blob));
  link.setAttribute("download", "childcare_summary.csv");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
