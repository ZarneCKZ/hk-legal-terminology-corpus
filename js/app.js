window.CORPUS = { entries: [] };

function currentFilters() {
  return {
    q: (document.getElementById("search").value || "").trim().toLowerCase(),
    category: document.getElementById("filter-category").value,
    checked: document.getElementById("filter-checked").value,
  };
}

function filteredEntries() {
  const { q, category, checked } = currentFilters();
  return CORPUS.entries.filter((e) => {
    if (category && e.category !== category) return false;
    if (checked && e.human_checked !== checked) return false;
    if (q) {
      const hay = [e.source_text, e.target_text, e.key_term, e.source_ref]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function updateUrl() {
  const { q, category, checked } = currentFilters();
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("cat", category);
  if (checked) params.set("checked", checked);
  const qs = params.toString();
  const url = qs ? `${location.pathname}?${qs}` : location.pathname;
  history.replaceState(null, "", url);
}

function readUrl() {
  const params = new URLSearchParams(location.search);
  document.getElementById("search").value = params.get("q") || "";
  document.getElementById("filter-category").value = params.get("cat") || "";
  document.getElementById("filter-checked").value = params.get("checked") || "";
}

function categoryLabel(value) {
  return I18N.t("cat." + value);
}

function unitLabel(value) {
  return I18N.t("unit." + value);
}

function renderTable() {
  const rows = filteredEntries();
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = "";

  document.getElementById("result-count").textContent =
    I18N.t("results").replace("{n}", rows.length).replace("{total}", CORPUS.entries.length);

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">' + I18N.t("results") + "</td></tr>";
  }

  rows.forEach((e) => {
    const tr = document.createElement("tr");

    const src = document.createElement("td");
    src.appendChild(termLink(e.source_text));

    const tgt = document.createElement("td");
    tgt.appendChild(termLink(e.target_text));

    const key = document.createElement("td");
    key.appendChild(termLink(e.key_term));

    const cat = document.createElement("td");
    cat.innerHTML = `<span class="tag ${e.category}">${categoryLabel(e.category)}</span>`;

    const checked = document.createElement("td");
    checked.textContent = I18N.t(e.human_checked === "yes" ? "yes" : "no");

    const unit = document.createElement("td");
    unit.textContent = unitLabel(e.unit);

    const srcRef = document.createElement("td");
    srcRef.textContent = e.source_ref;
    srcRef.title = e.source;

    tr.append(src, tgt, key, cat, checked, unit, srcRef);
    tbody.appendChild(tr);
  });
}

function termLink(text) {
  const a = document.createElement("a");
  a.className = "term-link";
  a.textContent = text;
  a.href = "#";
  a.dataset.term = text;
  a.addEventListener("click", (ev) => {
    ev.preventDefault();
    document.getElementById("search").value = text;
    onStateChange();
  });
  return a;
}

function onStateChange() {
  updateUrl();
  renderTable();
  if (window.renderCharts) window.renderCharts();
}

function setSearchTerm(term) {
  document.getElementById("search").value = term;
  onStateChange();
}

function setFilterValue(id, value) {
  document.getElementById(id).value = value;
  onStateChange();
}

function exportCsv() {
  const rows = filteredEntries();
  const headers = ["record_id", "source_text", "target_text", "key_term", "category", "human_checked", "unit", "source_ref", "source"];
  const lines = [headers.join(",")];
  const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  rows.forEach((e) => {
    lines.push(headers.map((h) => esc(e[h] ?? "")).join(","));
  });
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "corpus_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function bindControls() {
  ["search", "filter-category", "filter-checked"].forEach((id) => {
    document.getElementById(id).addEventListener("input", onStateChange);
    document.getElementById(id).addEventListener("change", onStateChange);
  });
  document.getElementById("reset").addEventListener("click", () => {
    document.getElementById("search").value = "";
    document.getElementById("filter-category").value = "";
    document.getElementById("filter-checked").value = "";
    onStateChange();
  });
  document.getElementById("export-csv").addEventListener("click", exportCsv);
}

async function loadData() {
  if (window.CORPUS_DATA && window.CORPUS_DATA.entries) {
    CORPUS.entries = window.CORPUS_DATA.entries;
    return;
  }
  const res = await fetch("data/corpus.json");
  const payload = await res.json();
  CORPUS.entries = payload.entries;
}

window.renderApp = function renderApp() {
  renderTable();
  if (window.renderCharts) window.renderCharts();
};

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  readUrl();
  bindControls();
  renderTable();
  if (window.initCharts) window.initCharts();
});
