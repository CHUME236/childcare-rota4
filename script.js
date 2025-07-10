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
     // Header
     const header = document.createElement("div");
     header.className = "day-header";
     header.textContent = `${day} ${daysOfWeek[dow]}`;
     // Drop-off selector
     const selectDropoff = document.createElement("select");
     selectDropoff.innerHTML = `
<option value="">--Drop-off--</option>
<option value="mother">Mother</option>
<option value="father">Father</option>`;
     selectDropoff.className = "select-caregiver dropoff";
     selectDropoff.value = localStorage.getItem(currentDate + "_dropoff") || "";
     // Pick-up selector
     const selectPickup = document.createElement("select");
     selectPickup.innerHTML = `
<option value="">--Pick-up--</option>
<option value="mother">Mother</option>
<option value="father">Father</option>`;
     selectPickup.className = "select-caregiver pickup";
     selectPickup.value = localStorage.getItem(currentDate + "_pickup") || "";
     // Comment box
     const commentBox = document.createElement("textarea");
     commentBox.className = "day-comment";
     commentBox.placeholder = "Add notes...";
     commentBox.value = localStorage.getItem(currentDate + "_comment") || "";
     commentBox.addEventListener("input", () => {
       localStorage.setItem(currentDate + "_comment", commentBox.value);
     });
     // Change handlers
     selectDropoff.addEventListener("change", () => {
       localStorage.setItem(currentDate + "_dropoff", selectDropoff.value);
       updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
     });
     selectPickup.addEventListener("change", () => {
       localStorage.setItem(currentDate + "_pickup", selectPickup.value);
       updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
     });
     // Initial styling
     updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
     // Assemble cell
     cell.appendChild(header);
     cell.appendChild(selectDropoff);
     cell.appendChild(selectPickup);
     cell.appendChild(commentBox);
     monthGrid.appendChild(cell);
   }
   section.appendChild(title);
   section.appendChild(monthGrid);
   calendar.appendChild(section);
 }
}
function updateDayCellStyle(cell, dropoff, pickup) {
 cell.className = "day";
 if (dropoff) cell.classList.add(`${dropoff}-dropoff`);
 if (pickup) cell.classList.add(`${pickup}-pickup`);
}
