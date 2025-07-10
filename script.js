document.addEventListener("DOMContentLoaded", buildCalendar);
function buildCalendar() {
 const calendar = document.getElementById("calendar");
 calendar.innerHTML = ""; // Clear existing
 const date = new Date();
 const year = date.getFullYear();
 const month = date.getMonth();
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
 for (let day = 1; day <= daysInMonth; day++) {
   const cell = document.createElement("div");
   cell.className = "day";
   const currentDate = `${year}-${month + 1}-${day}`;
   // Header
   const header = document.createElement("div");
   header.className = "day-header";
   const dow = new Date(year, month, day).getDay();
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
   // Change handlers
   selectDropoff.addEventListener("change", () => {
     localStorage.setItem(currentDate + "_dropoff", selectDropoff.value);
     updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
   });
   selectPickup.addEventListener("change", () => {
     localStorage.setItem(currentDate + "_pickup", selectPickup.value);
     updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
   });
   // Initial style
   updateDayCellStyle(cell, selectDropoff.value, selectPickup.value);
   // Append to cell
   cell.appendChild(header);
   cell.appendChild(selectDropoff);
   cell.appendChild(selectPickup);
   calendar.appendChild(cell);
 }
}
function updateDayCellStyle(cell, dropoff, pickup) {
 cell.className = "day"; // Reset
 if (dropoff) cell.classList.add(`${dropoff}-dropoff`);
 if (pickup) cell.classList.add(`${pickup}-pickup`);
}
