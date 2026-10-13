// Live parts of the Pulse website, in the app's moods, categories and icons (ICON comes from icons.js, built from
// the app's Tabler icons). The hero writes today's entry, the check-in updates the Insights sentence, and the
// calendar is this month. Colours are CSS variables from site.css (the app's moodColors.json and
// categoryColors.json), so light and dark mode both work: --great, --great-soft, --great-deep and so on.
const MOOD = {
  great: { label: "Great", icon: "MoodSmileBeam" },
  good: { label: "Good", icon: "MoodHappy" },
  okay: { label: "Okay", icon: "MoodNeutral" },
  low: { label: "Low", icon: "MoodSad" },
  rough: { label: "Rough", icon: "CloudRain" },
};
const CAT = { personal: "Home", work: "Briefcase", health: "Heart" };
const v = (name, kind = "") => `var(--${name}${kind ? "-" + kind : ""})`;
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmtTime = (d) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const moodChip = (m) => `<span class="chip" style="--tint:${v(m)}">${ICON[MOOD[m].icon]}${MOOD[m].label}</span>`;
const placeChip = (p) => `<span class="chip" style="--tint:${v("rough")}">${ICON.MapPin}${p}</span>`;

// ---- Hero: today's entry types itself, cycling through a few days from the demo journal ----
const ENTRIES = [
  { title: "Slow morning", body: "Corner table, flat white, nowhere to be. Started the book Maya lent me and actually got through three chapters.", photos: ["cafe", "book"], mood: "good", place: "Borough", cat: "personal" },
  { title: "Early run", body: "Sun coming up over the park, nobody else around. 5k without stopping for the first time since summer.", photos: ["field"], mood: "great", place: "Regent's Park", cat: "health" },
  { title: "St Paul's after work", body: "Took the long way home across the bridge. The dome lit up against the dark always makes me stop for a minute.", photos: ["stpauls"], mood: "good", place: "Millennium Bridge", cat: "personal" },
  { title: "Pitch went well", body: "Recorded my notes on the walk back so I don't lose the questions they asked. Follow up with Priya on Monday.", photos: ["canal"], mood: "great", place: "King's Cross", cat: "work" },
];
function badge(el, d, today) {
  const wd = d.toLocaleDateString([], { weekday: "short" }).toUpperCase(), mon = d.toLocaleDateString([], { month: "short" }).toUpperCase();
  el.innerHTML = `<small>${today ? "TODAY" : wd}</small><b>${d.getDate()}</b><span>${mon}</span>`;
}
function paintEntry(card, e, at) {
  card.innerHTML = `<h3></h3><p></p><div class="photos ${e.photos.length === 1 ? "one" : ""}">${e.photos.map((p) => `<img src="photos/${p}.webp" alt="">`).join("")}</div>
    <div class="felt">Felt ${moodChip(e.mood)} at ${placeChip(e.place)}</div>
    <div class="foot"><span class="cat" style="background:${v(e.cat, "soft")};color:${v(e.cat, "deep")}">${ICON[CAT[e.cat]]}</span><span>${fmtTime(at)}</span></div>`;
  return [card.querySelector("h3"), card.querySelector("p")];
}
async function startHero() {
  const today = document.getElementById("today"), yday = document.getElementById("yesterday");
  if (!today) return;
  const now = new Date(), y = new Date(now.getTime() - 864e5);
  badge(document.getElementById("today-badge"), now, true);
  badge(document.getElementById("yday-badge"), y, false);
  const concert = { title: "Finally saw them live", body: "Ten years of listening on the bus and they opened with the one song I wanted. Lost my voice by the encore.", photos: ["concert"], mood: "great", place: "Camden Town", cat: "personal" };
  const [yh, yp] = paintEntry(yday, concert, new Date(y.setHours(21, 45)));
  yh.textContent = concert.title; yp.textContent = concert.body;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; ; i = (i + 1) % ENTRIES.length) {
    const e = ENTRIES[i], [h, p] = paintEntry(today, e, new Date());
    if (still) { h.textContent = e.title; p.textContent = e.body; return; }
    const caret = '<span class="caret"></span>';
    for (let k = 1; k <= e.title.length; k++) { h.innerHTML = e.title.slice(0, k) + caret; await sleep(45); }
    h.textContent = e.title;
    for (let k = 1; k <= e.body.length; k++) { p.innerHTML = e.body.slice(0, k) + caret; await sleep(22); }
    p.innerHTML = e.body;
    await sleep(5000);
  }
}

// ---- Check in: tap a mood, and the week and the Insights sentence follow ----
function startCheckin() {
  const week = document.getElementById("week");
  if (!week) return;
  // The last seven days, ending today (index 6); the six before today come from the demo journal.
  const now = new Date(), dow = 6;
  const PAST = ["good", "great", "okay", "good", "rough", "good"];
  const days = [...PAST, null];
  const letters = Array.from({ length: 7 }, (_, i) => new Date(now.getTime() - (6 - i) * 864e5).toLocaleDateString([], { weekday: "narrow" }));
  const faces = document.getElementById("faces");
  faces.innerHTML = Object.entries(MOOD).map(([k, m]) => `<button class="face" data-m="${k}" aria-label="${m.label}" style="background:${v(k, "soft")};color:${v(k, "deep")}">${ICON[m.icon]}</button>`).join("");
  document.getElementById("facelabels").innerHTML = Object.values(MOOD).map((m) => `<span>${m.label}</span>`).join("");
  // A highlighted word in the sentence: soft fill, deep text, wavy underline in the full colour.
  const word = (name, icon, text) => `<span class="w" style="background:${v(name, "soft")};color:${v(name, "deep")};text-decoration-color:${v(name)}">${ICON[icon]}${text}</span>`;
  const paint = () => {
    week.innerHTML = letters.map((l, i) => `<div class="d ${i === dow ? "today" : ""}">${l}<i style="${days[i] ? `background:${v(days[i])}` : ""}"></i></div>`).join("");
    faces.querySelectorAll(".face").forEach((b) => {
      b.classList.toggle("on", b.dataset.m === days[dow]);
      b.setAttribute("aria-pressed", b.dataset.m === days[dow]);
    });
    const done = days.filter(Boolean), count = {};
    done.forEach((m) => (count[m] = (count[m] || 0) + 1));
    const top = Object.keys(MOOD).reduce((a, b) => ((count[b] || 0) > (count[a] || 0) ? b : a), "good");
    let streak = 0;
    for (let i = days[dow] ? dow : dow - 1; i >= 0 && days[i]; i--) streak++;
    const streakTotal = streak + 2; // the demo journal's streak started before this week
    document.getElementById("sentence").innerHTML =
      `In the last 7 days you checked in on ${word("personal", "Calendar", `${done.length} ${done.length === 1 ? "day" : "days"}`)}. ` +
      `Mostly, you felt ${word(top, MOOD[top].icon, MOOD[top].label)}. ` +
      (days[dow] ? `You're on a ${word("rough", "Flame", `${streakTotal}-day streak`)}.` : `Check in to keep your ${word("rough", "Flame", "streak")} going.`);
    document.getElementById("streak-n").innerHTML = `${streakTotal}<small>days</small>`;
    document.getElementById("week-n").innerHTML = `${done.length}<small>/ 7</small>`;
    document.getElementById("week-bar").style.width = `${(done.length / 7) * 100}%`;
  };
  faces.addEventListener("click", (e) => {
    const b = e.target.closest(".face");
    if (!b) return;
    days[dow] = days[dow] === b.dataset.m ? null : b.dataset.m;
    paint();
  });
  paint();
}

// ---- Calendar: this month, with photo days and mood days up to today ----
function paintCalendar() {
  const grid = document.getElementById("cal-days");
  if (!grid) return;
  const now = new Date(), y = now.getFullYear(), m = now.getMonth(), today = now.getDate();
  const first = (new Date(y, m, 1).getDay() + 6) % 7, len = new Date(y, m + 1, 0).getDate();
  const PHOTOS = ["concert", "cafe", "bench", "raspberries", "stpauls", "dog", "field", "waves", "canal", "book"];
  const MOODS = ["good", "great", "okay", "rough", "good", "low"];
  let cells = "", entries = 0;
  for (let i = 0; i < first; i++) cells += "<span></span>";
  for (let d = 1; d <= len; d++) {
    // A made-up but steady pattern: most days written, a few skipped, every third with a photo; the last week unbroken.
    const written = d <= today && (today - d < 7 || (d * 7) % 5 !== 0);
    const cls = ["day", d === today ? "today" : "", d > today ? "future" : ""];
    if (!written) { cells += `<span class="${cls.join(" ")}">${d}</span>`; continue; }
    entries++;
    if ((d * 5) % 3 === 0 || d === today) {
      cells += `<span class="${cls.join(" ")} photo" style="background-image:url(photos/${PHOTOS[(d * 3) % PHOTOS.length]}.webp)"><b>${d}</b></span>`;
    } else {
      const mood = MOODS[d % MOODS.length];
      cells += `<span class="${cls.join(" ")} entry-day">${d}<span style="color:${v(mood)};display:flex">${ICON[MOOD[mood].icon]}</span></span>`;
    }
  }
  grid.innerHTML = cells;
  document.getElementById("cal-month").textContent = now.toLocaleDateString([], { month: "long", year: "numeric" });
  document.getElementById("cal-streak").innerHTML = `${ICON.Calendar}${entries} ${entries === 1 ? "entry" : "entries"}`;
}

startHero();
startCheckin();
paintCalendar();

// The phone menu is a <details>; close it when one of its links jumps down the page.
document.querySelectorAll(".menu-panel a").forEach((a) => a.addEventListener("click", () => a.closest("details").removeAttribute("open")));
