document.addEventListener("DOMContentLoaded", buildCalendars);
function buildCalendars() {
 const calendar = document.getElementById("calendar");
 calendar.innerHTML = "";
 const year = 2025;
 const months = ["July", "August", "September", "October", "November", "December"];
 const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
 for (let month = 6; month <= 11; month++) {
   const section = document.createElement("section");
   const title = document.createElement("h2");
   title.textContent = `${months[month - 6]} ${year}`;
   section.appendChild(title);
   const monthGrid = document.createElement("div");
   monthGrid.className = "month-grid";
   const daysInMonth = new Date(year, month + 1, 0).getDate();
   for (let day = 1; day <= daysInMonth; day++) {
     const cell = document.createElement("div");
     cell.className = "day";
     const currentDate = `${year}-${month + 1}-${day}`;
     const dow = new Date(year, month, day).getDay();
     const header = document.createElement("div");
     header.className = "day-header";
     header.textContent = `${day} ${daysOfWeek[dow]}`;
     // Drop-off
     const selectDropoff = document.createElement("select");
     selectDropoff.className = "select-caregiver dropoff";
     selectDropoff.innerHTML = `
<option value="">--Drop-off--</option>
<option value="mother">Mother</option>
<option value="father">Father</option>`;
     selectDropoff.value = localStorage.getItem(currentDate + "_dropoff") || "";
     // Pick-up
     const selectPickup = document.createElement("select");
     selectPickup.className = "select-caregiver pickup";
     selectPickup.innerHTML = `
<option value="">--Pick-up--</option>
<option value="mother">Mother</option>
<option value="father">Father</option>`;
     selectPickup.value = localStorage.getItem(currentDate + "_pickup") || "";
     // Appointment
     const selectAppointment = document.createElement("select");
     selectAppointment.className = "select-appointment";
     selectAppointment.innerHTML = `
<option value="">--Appointment--</option>
<option value="dentist">Dentist</option>
<option value="drs">Drs</option>
<option value="pe">PE</option>
<option value="party">Party</option>
<option value="swimming">Swimming</option>`;
     selectAppointment.value = localStorage.getItem(currentDate + "_appointment") || "";
     // Flags: Ivy & Everly
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
     // Comment box
     const commentBox = document.createElement("textarea");
     commentBox.className = "day-comment";
     commentBox.placeholder = "Add notes...";
     commentBox.value = localStorage.getItem(currentDate + "_comment") || "";
     commentBox.addEventListener("input", () =>
       localStorage.setItem(currentDate + "_comment", commentBox.value)
     );
     // Event handlers
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
     // Apply saved styles
     updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
     updateAppointmentStyle(cell, selectAppointment.value);
     // Append elements
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
