document.addEventListener("DOMContentLoaded", () => {
  buildCalendars();
  setupPageToggle();
  setupFilters();
  setupExportButton();
  updateSummary();
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

    // Adjust for Monday-starting week (0=Monday, 6=Sunday)
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
        <option value="father">Father</option>
      `;
      selectDropoff.value = localStorage.getItem(currentDate + "_dropoff") || "";

      const selectPickup = document.createElement("select");
      selectPickup.className = "select-caregiver pickup";
      selectPickup.innerHTML = `
        <option value="">--Pick-up--</option>
        <option value="mother">Mother</option>
        <option value="father">Father</option>
      `;
      selectPickup.value = localStorage.getItem(currentDate + "_pickup") || "";

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
        updateSummary();
      });

      selectPickup.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_pickup", selectPickup.value);
        updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
        updateSummary();
      });

      selectAppointment.addEventListener("change", () => {
        localStorage.setItem(currentDate + "_appointment", selectAppointment.value);
        updateAppointmentStyle(cell, selectAppointment.value);
        updateSummary();
      });

      ivyCheckbox.addEventListener("change", updateSummary);
      everlyCheckbox.addEventListener("change", updateSummary);
      commentBox.addEventListener("input", updateSummary);

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

function setupPageToggle() {
  const showCalendarBtn = document.getElementById("showCalendarBtn");
  const showSummaryBtn = document.getElementById("showSummaryBtn");
  const calendar = document.getElementById("calendar");
  const summary = document.getElementById("summary");
  showCalendarBtn.addEventListener("click", () => {
    calendar.style.display = "flex";
    summary.style.display = "none";
  });
  showSummaryBtn.addEventListener("click", () => {
    calendar.style.display = "none";
    summary.style.display = "block";
    updateSummary();
  });
}

function setupFilters() {
  const filterCaregiver = document.getElementById("filterCaregiver");
  const filterChild = document.getElementById("filterChild");

  filterCaregiver.addEventListener("change", updateSummary);
  filterChild.addEventListener("change", updateSummary);
}

function updateSummary() {
  const summaryBody = document.getElementById("summaryBody");
  summaryBody.innerHTML = "";

  const filterCaregiver = document.getElementById("filterCaregiver").value;
  const filterChild = document.getElementById("filterChild").value;

  const year = 2025;
  const months = ["July", "August", "September", "October", "November", "December"];

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

      // Skip empty rows (no info)
      if (!dropoff && !pickup && !appointment && !ivy && !everly && !comment) continue;

      // Filtering by caregiver
      if (filterCaregiver !== "all") {
        const caregivers = [dropoff, pickup];
        if (!caregivers.includes(filterCaregiver)) continue;
      }

      // Filtering by child
      if (filterChild !== "all") {
        if (filterChild === "ivy" && !ivy) continue;
        if (filterChild === "everly" && !everly) continue;
      }

      const caregiversPresent = [];
      if (dropoff) caregiversPresent.push(`Drop-off: ${capitalize(dropoff)}`);
      if (pickup) caregiversPresent.push(`Pick-up: ${capitalize(pickup)}`);

      const childrenPresent = [];
      if (ivy) childrenPresent.push("Ivy");
      if (everly) childrenPresent.push("Everly");

      const tr = document.createElement("tr");

      // Determine row highlight based on caregivers only (dropoff/pickup)
      const caregiversSet =
