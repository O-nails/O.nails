const TELEGRAM_USERNAME = "olkadolka228";
const form = document.getElementById("bookingForm");
const dateInput = document.getElementById("date");
const dateStatus = document.getElementById("dateStatus");

// The server is the source of truth. A booked date is disabled for every visitor.
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dateInput.min = today.toISOString().slice(0, 10);

let bookedDates = new Set();

function formatDate(value) {
  if (!value) return "не указана";
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}`;
}

function checkedValue(name) {
  const el = form.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "не указано";
}

function checkboxValue(name) {
  const el = form.querySelector(`input[name="${name}"]`);
  return el && el.checked ? "да" : "нет";
}

function setStatus(text, kind = "") {
  dateStatus.textContent = text;
  dateStatus.className = `date-status ${kind}`.trim();
}

async function loadBookedDates() {
  try {
    const response = await fetch("/api/booked-dates", { cache: "no-store" });
    if (!response.ok) throw new Error("availability");
    const data = await response.json();
    bookedDates = new Set(data.dates || []);

    // Disable already booked dates in the native date picker.
    dateInput.addEventListener("input", checkSelectedDate);
    checkSelectedDate();
    setStatus("Свободные даты можно выбрать. Забронированные будут недоступны.", "free");
  } catch {
    // If the backend is not running, do not pretend that availability is known.
    setStatus("Не удалось проверить занятые даты. Запись доступна только через сервер.", "error");
  }
}

function checkSelectedDate() {
  const value = dateInput.value;
  if (!value) return;

  if (bookedDates.has(value)) {
    dateInput.value = "";
    setStatus("Эта дата уже занята. Выберите другую.", "busy");
  } else {
    setStatus("Дата свободна.", "free");
  }
}

dateInput.addEventListener("change", checkSelectedDate);
loadBookedDates();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const date = dateInput.value;
  const time = document.getElementById("time").value.trim() || "не указано";
  const length = checkedValue("length");
  const design = document.getElementById("design").value.trim() || "пришлю фото / обсудим";
  const removal = checkboxValue("removal");
  const correction = checkboxValue("correction");
  const comment = document.getElementById("comment").value.trim() || "нет";

  if (!date) {
    setStatus("Выберите свободную дату.", "busy");
    dateInput.focus();
    return;
  }

  if (bookedDates.has(date)) {
    setStatus("Эта дата уже занята. Выберите другую.", "busy");
    return;
  }

  const payload = {
    name,
    date,
    time,
    length,
    design,
    removal,
    correction,
    comment
  };

  const submitButton = form.querySelector(".submit-btn");
  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = "Проверяем и бронируем…";

  try {
    const response = await fetch("/api/book", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        bookedDates.add(date);
        setStatus("Эта дата только что была забронирована другой клиенткой. Выберите другую.", "busy");
        dateInput.value = "";
      } else {
        throw new Error(result.error || "booking");
      }
      return;
    }

    // Server accepted the booking: date is now unavailable for all visitors.
    bookedDates.add(date);
    setStatus("Дата забронирована и больше не показывается как свободная.", "free");

    const message = [
      "Здравствуйте! Хочу записаться на маникюр 💗",
      "",
      `Имя: ${name}`,
      `Желаемая дата: ${formatDate(date)}`,
      `Желаемое время: ${time}`,
      `Длина: ${length}`,
      `Дизайн: ${design}`,
      `Снятие: ${removal}`,
      `Коррекция: ${correction}`,
      `Комментарий: ${comment}`,
      "",
      "Источник: сайт O.nails"
    ].join("\n");

    const tgUrl = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`;
    window.open(tgUrl, "_blank", "noopener,noreferrer");
  } catch {
    setStatus("Не удалось сохранить бронь. Проверьте подключение к серверу и попробуйте ещё раз.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
});
