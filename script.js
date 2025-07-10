const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

function buildCalendar(month, year) {
const calendar = document.getElementById("calendar");
calendar.innerHTML = "";

const firstDay = new Date(year, month, 1).getDay();
const totalDays = new Date(year, month + 1, 0).getDate();

// Fill initial empty cells
for (let i = 0; i < firstDay; i++) {
calendar.appendChild(document.createElement("div"));
}

for (let day = 1; day <= totalDays; day++) {
const cell = document.createElement("div");
cell.className = "day";
const date = `${year}-${month + 1}-${day}`;
const saved = localStorage.getItem(date);

const header = document.createElement("div");
header.className = "day-header";
header.textContent = `${day} ${daysOfWeek[new Date(year, month, day).getDay()]}`;

const select = document.createElement("select");
select.className = "select-caregiver";
select.innerHTML = `<option value="">--Select--</option>
<option value="mother">Mother</option>
<option value="father">Father</option>`;

if (saved) {
select.value = saved;
cell.classList.add(saved);
}

select.addEventListener("change", () => {
localStorage.setItem(date, select.value);
cell.className = "day";
if (select.value) cell.classList.add(select.value);
});

cell.appendChild(header);
cell.appendChild(select);
calendar.appendChild(cell);
}
}

buildCalendar(currentMonth, currentYear);
