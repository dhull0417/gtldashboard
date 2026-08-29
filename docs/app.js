// --- Password gate -----------------------------------------------------
// This is a casual deterrent, not real access control: the hash and the
// underlying data file are both visible to anyone who inspects the page.
// To change the password, compute a new SHA-256 hex digest and replace
// PASSWORD_HASH below, e.g. in a browser console:
//   crypto.subtle.digest("SHA-256", new TextEncoder().encode("your-password"))
//     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("")))
const PASSWORD_HASH = "c9f96fd234c16cc2df9eb97b40598dabd3368c81eed1929f6d80562ffc895ee1";
const SESSION_KEY = "gtl-dashboard-unlocked";

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function tryUnlock(password) {
  const hash = await sha256Hex(password);
  return hash === PASSWORD_HASH;
}

function showApp() {
  document.getElementById("gate").hidden = true;
  document.getElementById("app").hidden = false;
  init();
}

function setupGate() {
  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    showApp();
    return;
  }
  const input = document.getElementById("gate-password");
  const submit = document.getElementById("gate-submit");
  const error = document.getElementById("gate-error");

  async function attempt() {
    const ok = await tryUnlock(input.value);
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
      showApp();
    } else {
      error.textContent = "Incorrect password.";
      input.value = "";
      input.focus();
    }
  }

  submit.addEventListener("click", attempt);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") attempt();
  });
  input.focus();
}

// --- Dashboard -----------------------------------------------------------

const RANGE_DAYS = { "1d": 1, "7d": 7, "30d": 30, "3m": 90, "1y": 365, all: Infinity };
const METRICS = [
  { key: "users", color: "var(--series-users)" },
  { key: "groups", color: "var(--series-groups)" },
  { key: "meetups", color: "var(--series-meetups)" },
];

let allDays = [];
let currentRange = "30d";

function filterByRange(days, range) {
  const n = RANGE_DAYS[range];
  if (!Number.isFinite(n)) return days;
  return days.slice(-n);
}

function resolveColor(cssVar) {
  const name = cssVar.slice(4, -1); // "var(--series-users)" -> "--series-users"
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function niceMax(max) {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = Math.ceil(max / magnitude);
  return step * magnitude;
}

function renderChart(card, metricKey, color, days) {
  const svg = card.querySelector("[data-chart]");
  const tooltip = card.querySelector("[data-tooltip]");
  const tooltipValue = card.querySelector("[data-tooltip-value]");
  const tooltipDate = card.querySelector("[data-tooltip-date]");
  const totalEl = card.querySelector("[data-total]");

  const values = days.map((d) => d[metricKey]);
  const total = values.reduce((a, b) => a + b, 0);
  totalEl.textContent = total.toLocaleString();

  const width = 960;
  const height = 180;
  const padTop = 12;
  const padBottom = 24;
  const padX = 8;
  const max = niceMax(Math.max(...values, 0));

  const xFor = (i) =>
    days.length <= 1 ? width / 2 : padX + (i / (days.length - 1)) * (width - padX * 2);
  const yFor = (v) => padTop + (1 - v / max) * (height - padTop - padBottom);

  const linePoints = days.map((d, i) => `${xFor(i)},${yFor(d[metricKey])}`).join(" ");

  const gridY = [0, 0.5, 1].map((t) => padTop + t * (height - padTop - padBottom));

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.innerHTML = `
    ${gridY.map((y) => `<line class="gridline" x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" />`).join("")}
    <line class="baseline" x1="${padX}" y1="${height - padBottom}" x2="${width - padX}" y2="${height - padBottom}" />
    <polyline fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${linePoints}" />
    <line class="crosshair" data-crosshair x1="0" y1="${padTop}" x2="0" y2="${height - padBottom}" />
    <circle class="hover-dot" data-hover-dot r="5" fill="${color}" stroke="var(--surface)" stroke-width="2" />
    <text class="axis-label" x="${padX}" y="${height - 6}" text-anchor="start">${days[0]?.date ?? ""}</text>
    <text class="axis-label" x="${width - padX}" y="${height - 6}" text-anchor="end">${days[days.length - 1]?.date ?? ""}</text>
  `;

  const crosshair = svg.querySelector("[data-crosshair]");
  const hoverDot = svg.querySelector("[data-hover-dot]");
  const wrap = card.querySelector(".chart-wrap");

  function onMove(evt) {
    const rect = svg.getBoundingClientRect();
    const relX = ((evt.clientX - rect.left) / rect.width) * width;
    let idx = 0;
    let best = Infinity;
    days.forEach((d, i) => {
      const dist = Math.abs(xFor(i) - relX);
      if (dist < best) {
        best = dist;
        idx = i;
      }
    });
    const px = xFor(idx);
    const py = yFor(days[idx][metricKey]);
    crosshair.setAttribute("x1", px);
    crosshair.setAttribute("x2", px);
    crosshair.style.opacity = 1;
    hoverDot.setAttribute("cx", px);
    hoverDot.setAttribute("cy", py);
    hoverDot.style.opacity = 1;

    tooltipValue.textContent = days[idx][metricKey].toLocaleString();
    tooltipDate.textContent = days[idx].date;
    tooltip.style.opacity = 1;
    tooltip.style.left = `${(px / width) * 100}%`;
    tooltip.style.top = `${(py / height) * 100}%`;
  }

  function onLeave() {
    crosshair.style.opacity = 0;
    hoverDot.style.opacity = 0;
    tooltip.style.opacity = 0;
  }

  wrap.onpointermove = onMove;
  wrap.onpointerleave = onLeave;
}

function renderTable(days) {
  const body = document.getElementById("table-body");
  body.innerHTML = days
    .map((d) => `<tr><td>${d.date}</td><td>${d.users}</td><td>${d.groups}</td><td>${d.meetups}</td></tr>`)
    .join("");
}

function renderAll() {
  const days = filterByRange(allDays, currentRange);
  METRICS.forEach(({ key, color }) => {
    const card = document.querySelector(`.chart-card[data-metric="${key}"]`);
    renderChart(card, key, resolveColor(color), days);
  });
  renderTable(days);
}

function setupRangeRow() {
  const row = document.getElementById("range-row");
  row.querySelectorAll("button").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.range === currentRange ? "true" : "false");
    btn.addEventListener("click", () => {
      currentRange = btn.dataset.range;
      row.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.range === currentRange ? "true" : "false"));
      renderAll();
    });
  });
}

function setupTableToggle() {
  const toggle = document.getElementById("table-toggle");
  const view = document.getElementById("table-view");
  toggle.addEventListener("click", () => {
    view.hidden = !view.hidden;
    toggle.textContent = view.hidden ? "View as table" : "Hide table";
  });
}

async function init() {
  setupRangeRow();
  setupTableToggle();
  const res = await fetch("data/stats.json", { cache: "no-store" });
  allDays = await res.json();
  renderAll();
  window.addEventListener("resize", renderAll);
}

setupGate();
