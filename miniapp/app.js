const TG = window.Telegram?.WebApp;

TG?.ready();
TG?.expand();

if (TG) {
  TG.setHeaderColor?.("#fff9fa");
  TG.setBackgroundColor?.("#f9eef1");
  TG.setBottomBarColor?.("#fff9fa");
}

const SUPABASE_URL =
  "https://agvkksymvwsmrcxpjhts.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_IaNqi5idKSJYHqfWWA9AGA_FDyyJaFu";

const API =
  SUPABASE_URL + "/functions/v1/miniapp-api";

const user =
  TG?.initDataUnsafe?.user || {};

const initData =
  TG?.initData || "";

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  [...document.querySelectorAll(selector)];

const screens =
  $$(".screen");

const nav =
  $$(".bottom-nav button");


/* =====================================================
   NAVIGATION
===================================================== */

function go(id) {
  screens.forEach((screen) => {
    screen.classList.toggle(
      "active",
      screen.id === id,
    );
  });

  nav.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.screen === id,
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  if (id === "mybooking") {
    loadBooking("bookingBox");
  }

  if (id === "cancel") {
    loadBooking(
      "cancelBox",
      true,
      false,
    );
  }

  if (id === "reschedule") {
    loadBooking(
      "rescheduleBox",
      false,
      true,
    );
  }
}


$$('[data-screen]').forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        go(button.dataset.screen);
      },
    );
  },
);


$$(".back").forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => go("home"),
    );
  },
);


$("#closeBtn")?.addEventListener(
  "click",
  () => {
    TG?.close?.();
  },
);


/* =====================================================
   TELEGRAM
===================================================== */

$("#adminBtn")?.addEventListener(
  "click",
  () => {
    const url =
      "https://t.me/olkadolka228";

    if (TG?.openTelegramLink) {
      TG.openTelegramLink(url);
    } else {
      window.location.href = url;
    }
  },
);


/* =====================================================
   USER DATA
===================================================== */

const telegramName =
  [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ");

if ($("#name") && telegramName) {
  $("#name").value =
    telegramName;
}


if ($("#date")) {
  $("#date").min =
    new Date()
      .toISOString()
      .slice(0, 10);
}


/* =====================================================
   API
===================================================== */

async function api(
  action,
  extra = {},
) {
  if (!initData) {
    throw new Error(
      "Откройте O.nails через Telegram.",
    );
  }

  const response =
    await fetch(API, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "apikey":
          SUPABASE_KEY,
      },

      body: JSON.stringify({
        action,
        initData,
        ...extra,
      }),
    });

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (
    !response.ok ||
    !data?.ok
  ) {
    throw new Error(
      data?.error ||
        "Ошибка сервера.",
    );
  }

  return data;
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function esc(value) {
  return String(
    value ?? "—",
  ).replace(
    /[&<>"']/g,
    (match) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[match],
  );
}


/* =====================================================
   BOOKING HTML
===================================================== */

function bookingHtml(
  booking,
) {
  if (!booking) {
    return `
      <div class="loader">
        ❌ Активная запись не найдена.
      </div>
    `;
  }

  const date =
    String(
      booking.booking_date ||
        "",
    )
      .split("-")
      .reverse()
      .join(".");

  return `
    <div class="booking-details">

      <div class="detail">
        <span>👤 Имя</span>
        <b>${esc(
          booking.name,
        )}</b>
      </div>

      <div class="detail">
        <span>📅 Дата</span>
        <b>${esc(date)}</b>
      </div>

      <div class="detail">
        <span>🕐 Время</span>
        <b>${esc(
          String(
            booking.booking_time ||
              "16:00",
          ).slice(0, 5),
        )}</b>
      </div>

      <div class="detail">
        <span>💅 Длина</span>
        <b>${esc(
          booking.nail_length,
        )}</b>
      </div>

      <div class="detail">
        <span>🎨 Дизайн</span>
        <b>${esc(
          booking.design ||
            "нет",
        )}</b>
      </div>

      <div class="detail">
        <span>✂️ Снятие</span>
        <b>${
          booking.removal
            ? "да"
            : "нет"
        }</b>
      </div>

      <div class="detail">
        <span>🔧 Коррекция</span>
        <b>${
          booking.correction
            ? "да"
            : "нет"
        }</b>
      </div>

      <div class="detail">
        <span>💬 Комментарий</span>
        <b>${esc(
          booking.comment ||
            "нет",
        )}</b>
      </div>

    </div>
  `;
}


/* =====================================================
   LOAD MY BOOKING
===================================================== */

async function loadBooking(
  boxId,
  cancelMode = false,
  rescheduleMode = false,
) {
  const box =
    $("#" + boxId);

  if (!box) return;

  box.innerHTML = `
    <div class="loader">
      Загрузка…
    </div>
  `;

  try {
    const data =
      await api(
        "my_booking",
      );

    if (!data.booking) {
      box.innerHTML = `
        <div class="loader">
          ❌ Активная запись не найдена.
        </div>
      `;

      return;
    }

    box.innerHTML =
      bookingHtml(
        data.booking,
      );

    if (
      cancelMode
    ) {
      box.innerHTML += `
        <div class="actions">

          <button
            class="danger-btn"
            id="doCancel"
          >
            ❌ Отменить запись
          </button>

          <button
            class="secondary"
            id="backHome"
          >
            Назад
          </button>

        </div>
      `;
    } else if (
      rescheduleMode
    ) {
      renderReschedule(
        box,
        data.booking,
      );
    } else {
      box.innerHTML += `
        <div class="actions">

          <button
            class="secondary"
            id="toCancel"
          >
            ❌ Отменить
          </button>

          <button
            class="secondary"
            id="toReschedule"
          >
            🔄 Перенести
          </button>

        </div>
      `;
    }

    $("#backHome")?.addEventListener(
      "click",
      () => go("home"),
    );

    $("#toCancel")?.addEventListener(
      "click",
      () => go("cancel"),
    );

    $("#toReschedule")?.addEventListener(
      "click",
      () => go("reschedule"),
    );

    $("#doCancel")?.addEventListener(
      "click",
      cancelBooking,
    );

  } catch (error) {
    box.innerHTML = `
      <div class="loader">
        ❌ ${esc(
          error.message,
        )}
      </div>
    `;
  }
}


/* =====================================================
   CANCEL
===================================================== */

async function cancelBooking() {
  const confirmed =
    window.confirm(
      "Отменить вашу запись?",
    );

  if (!confirmed) {
    return;
  }

  try {
    await api(
      "cancel_booking",
    );

    toast(
      "Запись отменена",
    );

    go("home");

  } catch (error) {
    toast(
      error.message,
      true,
    );
  }
}


/* =====================================================
   RESCHEDULE
===================================================== */

function renderReschedule(
  box,
  booking,
) {
  box.innerHTML =
    bookingHtml(
      booking,
    ) +
    `
      <div
        class="form-card"
        style="margin-top:14px"
      >

        <label>
          Новая дата

          <input
            id="rescheduleDate"
            type="date"
          >
        </label>

        <div class="fixed-time">
          🕐 Время останется
          <b>16:00</b>
        </div>

        <button
          class="primary wide"
          id="doReschedule"
        >
          🔄 Перенести запись
        </button>

        <div
          id="resStatus"
          class="status"
        ></div>

      </div>
    `;

  const input =
    $("#rescheduleDate");

  if (!input) return;

  input.min =
    new Date()
      .toISOString()
      .slice(0, 10);

  $("#doReschedule")?.addEventListener(
    "click",
    async () => {
      const date =
        input.value;

      const status =
        $("#resStatus");

      if (!date) {
        status.textContent =
          "Выберите дату";

        status.className =
          "status error";

        return;
      }

      const day =
        new Date(
          date +
            "T00:00:00",
        ).getDay();

      if (
        day === 0 ||
        day === 6
      ) {
        status.textContent =
          "Можно выбрать только будний день";

        status.className =
          "status error";

        return;
      }

      try {
        await api(
          "reschedule_booking",
          {
            newDate: date,
          },
        );

        toast(
          "Запись перенесена",
        );

        go("mybooking");

      } catch (error) {
        status.textContent =
          error.message;

        status.className =
          "status error";
      }
    },
  );
}


/* =====================================================
   CREATE BOOKING
===================================================== */

async function submitBooking() {
  const status =
    $("#bookingStatus");

  const date =
    $("#date")?.value;

  const name =
    $("#name")?.value
      .trim();

  if (!name || !date) {
    status.textContent =
      "Заполните имя и дату";

    status.className =
      "status error";

    return;
  }

  const day =
    new Date(
      date +
        "T00:00:00",
    ).getDay();

  if (
    day === 0 ||
    day === 6
  ) {
    status.textContent =
      "Можно выбрать только будний день";

    status.className =
      "status error";

    return;
  }

  const button =
    $("#submitBooking");

  button.disabled = true;

  button.textContent =
    "Сохраняем…";

  status.textContent =
    "";

  try {
    const data =
      await api(
        "create_booking",
        {
          booking: {
            name,

            booking_date:
              date,

            booking_time:
              "16:00",

            nail_length:
              $("#length")
                ?.value || "",

            design:
              $("#design")
                ?.value
                .trim() || "",

            removal:
              Boolean(
                $("#removal")
                  ?.checked,
              ),

            correction:
              Boolean(
                $("#correction")
                  ?.checked,
              ),

            comment:
              $("#comment")
                ?.value
                .trim() || "",
          },
        },
      );

    status.textContent =
      "Запись успешно создана 💗";

    status.className =
      "status ok";

    toast(
      "Запись подтверждена",
    );

    setTimeout(
      () => go("mybooking"),
      500,
    );

  } catch (error) {
    status.textContent =
      error.message;

    status.className =
      "status error";

  } finally {
    button.disabled = false;

    button.textContent =
      "Подтвердить запись";
  }
}


$("#submitBooking")?.addEventListener(
  "click",
  submitBooking,
);


/* =====================================================
   TOAST
===================================================== */

function toast(
  text,
  error = false,
) {
  const element =
    $("#toast");

  if (!element) return;

  element.textContent =
    text;

  element.style.background =
    error
      ? "#9d5366"
      : "#3b2d32";

  element.classList.add(
    "show",
  );

  setTimeout(
    () => {
      element.classList.remove(
        "show",
      );
    },
    2200,
  );
}
