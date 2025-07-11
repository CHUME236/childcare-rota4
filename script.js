document.addEventListener("DOMContentLoaded", () => {
  buildCalendars();
  document.getElementById("showSummaryBtn").addEventListener("click", showSummary);
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
    const offset = (firstDay + 6) % 7; // Adjust for Monday-starting week

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

      // Drop-off select
      const selectDropoff = document.createElement("select");
      selectDropoff.className = "select-caregiver dropoff";
      selectDropoff.innerHTML = `
        <option value="">--Drop-off--</option>
        <option value="mother">Mother</option>
        <option value="father">Father</option>`;
      selectDropoff.value = localStorage.getItem(currentDate + "_dropoff") || "";

      // Pick-up select
      const selectPickup = document.createElement("select");
      selectPickup.className = "select-caregiver pickup";
      selectPickup.innerHTML = `
        <option value="">--Pick-up--</option>
        <option value="mother">Mother</option>
        <option value="father">Father</option>`;
      selectPickup.value = localStorage.getItem(currentDate + "_pickup") || "";

      // Appointment select
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

      // Event listeners for selects to update styles and storage
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

      // Append all to cell
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
  const summaryDiv = document.getElementById("summary");
  const calendarDiv = document.getElementById("calendar");
  const btn = document.getElementById("showSummaryBtn");

  if (summaryDiv.style.display === "block") {
    // Hide summary, show calendar
    summaryDiv.style.display = "none";
    calendarDiv.style.display = "flex";
    btn.textContent = "Show Summary";
    summaryDiv.innerHTML = "";
    return;
  }

  // Show summary, hide calendar
  calendarDiv.style.display = "none";
  summaryDiv.style.display = "block";
  btn.textContent = "Show Calendar";

  // Build caregiver filter UI
  summaryDiv.innerHTML = `
    <label for="caregiverFilter">Filter by caregiver:</label>
    <select id="caregiverFilter">
      <option value="all">All</option>
      <option value="mother">Mother</option>
      <option value="father">Father</option>
    </select>
    <div id="summaryContent"></div>
  `;

  document.getElementById("caregiverFilter").addEventListener("change", () => {
    buildSummary(document.getElementById("caregiverFilter").value);
  });

  buildSummary("all");
}

function buildSummary(filter) {
  const summaryContent = document.getElementById("summaryContent");
  summaryContent.innerHTML = "";

  const year = 2025;
  const months = ["July", "August", "September", "October", "November", "December"];

  // Collect all day entries from localStorage that have any data
  let entries = [];

  for (let month = 6; month <= 11; month++) {
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
        continue; // Skip empty days
      }

      // Apply caregiver filter
      if (filter === "mother" && dropoff !== "mother" && pickup !== "mother") continue;
      if (filter === "father" && dropoff !== "father" && pickup !== "father") continue;

      entries.push({
        date: new Date(year, month, day),
        dateString: `${day} ${months[month - 6]} ${year}`,
        dropoff,
        pickup,
        appointment,
        ivy,
        everly,
        comment,
      });
    }
  }

  if (entries.length === 0) {
    summaryContent.textContent = "No entries found for the selected filter.";
    return;
  }

  // Sort entries by date ascending
  entries.sort((a, b) => a.date - b.date);

  // Build a table to show summary
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";

  // Table Header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr style="background:#ddd;">
      <th style="border:1px solid #ccc; padding:6px;">Date</th>
      <th style="border:1px solid #ccc; padding:6px;">Drop-off</th>
      <th style="border:1px solid #ccc; padding:6px;">Pick-up</th>
      <th style="border:1px solid #ccc; padding:6px;">Appointment</th>
      <th style="border:1px solid #ccc; padding:6px;">Ivy</th>
      <th style="border:1px solid #ccc; padding:6px;">Everly</th>
      <th style="border:1px solid #ccc; padding:6px;">Notes</th>
    </tr>
  `;
  table.appendChild(thead);

  // Table Body
  const tbody = document.createElement("tbody");

  entries.forEach((entry) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="border:1px solid #ccc; padding:6px;">${entry.dateString}</td>
      <td style="border:1px solid #ccc; padding:6px;">${entry.dropoff || "-"}</td>
      <td style="border:1px solid #ccc; padding:6px;">${entry.pickup || "-"}</td>
      <td style="border:1px solid #ccc; padding:6px;">${entry.appointment || "-"}</td>
      <td style="border:1px solid #ccc; padding:6px; text-align:center;">${entry.ivy ? "✔" : ""}</td>
      <td style="border:1px solid #ccc; padding:6px; text-align:center;">${entry.everly ? "✔" : ""}</td>
      <td style="border:1px solid #ccc; padding:6px;">${entry.comment || "-"}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  summaryContent.appendChild(table);
}
