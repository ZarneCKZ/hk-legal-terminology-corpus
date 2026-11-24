window.chartInstances = {};
let modalInstance = null;
let currentChartId = null;
let sankeyTerm = null;
let networkTerms = null;

const WORDCLOUD_COLORS = ["#1f4e78", "#b3563a", "#2e7d5b", "#8a5a12", "#6b4fa0"];

function aggregateTerms(entries) {
  const map = new Map();
  entries.forEach((e) => {
    if (!map.has(e.source_text)) {
      map.set(e.source_text, { term: e.source_text, renderings: new Set() });
    }
    const t = map.get(e.source_text);
    e.renderings.forEach((r) => t.renderings.add(r));
  });
  return [...map.values()].map((t) => ({
    term: t.term,
    renderings: [...t.renderings],
    count: t.renderings.size,
  }));
}

function networkOptionFromTerms(termsList, compact) {
  const nodeMap = new Map();
  const links = [];
  termsList.forEach((t) => {
    if (!nodeMap.has(t.term)) {
      nodeMap.set(t.term, {
        name: t.term,
        category: 0,
        symbolSize: Math.min(16 + t.renderings.length * 5, 46),
      });
    }
    t.renderings.forEach((r) => {
      if (!nodeMap.has(r)) {
        nodeMap.set(r, { name: r, category: 1, symbolSize: 12 });
      }
      links.push({ source: t.term, target: r });
    });
  });

  return {
    tooltip: {
      formatter: (p) =>
        p.dataType === "node" ? p.name : p.data.source + " → " + p.data.target,
    },
    legend: compact
      ? []
      : [{ data: [I18N.t("chart.legend.en"), I18N.t("chart.legend.zh")], top: 0 }],
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        draggable: true,
        data: [...nodeMap.values()],
        links,
        categories: [
          { name: I18N.t("chart.legend.en"), itemStyle: { color: "#1f4e78" } },
          { name: I18N.t("chart.legend.zh"), itemStyle: { color: "#b3563a" } },
        ],
        label: { show: true, position: "right", fontSize: compact ? 9 : 11, color: "#333" },
        force: { repulsion: compact ? 120 : 200, edgeLength: compact ? 45 : 70, gravity: 0.08 },
        emphasis: { focus: "adjacency", lineStyle: { width: 3 } },
        lineStyle: { color: "#c7d2dc", width: 1, curveness: 0.08 },
      },
    ],
  };
}

function networkOption(entries, min, top, compact) {
  const termsList = aggregateTerms(entries)
    .filter((t) => t.count >= min)
    .sort((a, b) => b.count - a.count)
    .slice(0, top)
    .map((t) => ({ term: t.term, renderings: t.renderings }));
  return networkOptionFromTerms(termsList, compact);
}

function sankeyOptionFromTerms(termsList, compact) {
  const nodeMap = new Map();
  const links = [];
  termsList.forEach((t) => {
    if (!nodeMap.has(t.term)) nodeMap.set(t.term, { name: t.term, depth: 0 });
    t.renderings.forEach((r) => {
      if (!nodeMap.has(r)) nodeMap.set(r, { name: r, depth: 1 });
      links.push({ source: t.term, target: r, value: 1 });
    });
  });

  return {
    tooltip: {
      formatter: (p) =>
        p.dataType === "edge" ? p.data.source + " → " + p.data.target : p.name,
    },
    series: [
      {
        type: "sankey",
        data: [...nodeMap.values()],
        links,
        left: 8,
        right: compact ? 48 : 170,
        top: 8,
        bottom: 8,
        nodeWidth: 12,
        nodeGap: 8,
        layoutIterations: 48,
        label: { fontSize: compact ? 9 : 10, color: "#333" },
        lineStyle: { color: "gradient", curveness: 0.5, opacity: 0.3 },
        emphasis: { focus: "adjacency" },
      },
    ],
  };
}

function sankeyOption(entries, min, maxTerms, compact) {
  const termsList = aggregateTerms(entries)
    .filter((t) => t.count >= min)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxTerms)
    .map((t) => ({ term: t.term, renderings: t.renderings }));
  return sankeyOptionFromTerms(termsList, compact);
}

function corpusTermCounts() {
  const map = new Map();
  CORPUS.entries.forEach((e) => {
    const c = e.renderings_count || e.renderings.length;
    map.set(e.source_text, Math.max(map.get(e.source_text) || 0, c));
  });
  return map;
}

function allPolysemousTerms() {
  return [...corpusTermCounts().entries()]
    .filter(([, c]) => c >= 4)
    .map(([t]) => t);
}

function pickDefaultSankeyTerm() {
  const terms = allPolysemousTerms();
  return terms.length ? terms[Math.floor(Math.random() * terms.length)] : null;
}

function buildSankeyDatalist() {
  const dl = document.getElementById("sankey-terms");
  if (!dl) return;
  dl.innerHTML = "";
  [...corpusTermCounts().entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .forEach(([t]) => {
      const opt = document.createElement("option");
      opt.value = t;
      dl.appendChild(opt);
    });
}

function pickDefaultTerm(entries) {
  const terms = aggregateTerms(entries).filter((t) => t.count >= 2);
  return terms.length ? terms[Math.floor(Math.random() * terms.length)].term : null;
}

function sankeyPreviewOption(entries) {
  const term = sankeyTerm || pickDefaultTerm(entries);
  const entry = term ? entries.find((e) => e.source_text === term) : null;
  const renderings = entry ? entry.renderings : [];
  return sankeyOptionFromTerms(renderings.length ? [{ term, renderings }] : [], true);
}

function wordcloudOption(entries, compact) {
  const m = new Map();
  entries.forEach((e) => {
    m.set(e.key_term, Math.max(m.get(e.key_term) || 0, e.renderings_count));
  });
  const data = [...m.entries()]
    .filter(([, v]) => v >= 2)
    .map(([name, value]) => ({ name, value }));
  return {
    tooltip: {
      show: true,
      formatter: (p) => p.name + " · " + p.value + " rendering(s)",
    },
    series: [
      {
        type: "wordCloud",
        shape: "circle",
        sizeRange: compact ? [10, 26] : [12, 64],
        rotationRange: [0, 0],
        gridSize: compact ? 6 : 10,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: "sans-serif",
          color: () => WORDCLOUD_COLORS[Math.floor(Math.random() * WORDCLOUD_COLORS.length)],
        },
        data,
      },
    ],
  };
}

function pickRandomNetworkTerms(entries) {
  const terms = aggregateTerms(entries).filter((t) => t.count >= 2);
  for (let i = terms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [terms[i], terms[j]] = [terms[j], terms[i]];
  }
  return terms.slice(0, 8).map((t) => ({ term: t.term, renderings: t.renderings }));
}

function renderNetworkThumb() {
  const inst = window.chartInstances["chart-network"];
  if (!inst || !window.filteredEntries) return;
  const entries = window.filteredEntries();
  let opt;
  if (networkTerms && networkTerms.length) {
    opt = networkOptionFromTerms(networkTerms, true);
  } else {
    const top = aggregateTerms(entries)
      .filter((t) => t.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((t) => ({ term: t.term, renderings: t.renderings }));
    opt = networkOptionFromTerms(top, true);
  }
  inst.setOption(opt, true);
}

function renderSankeyThumb() {
  const inst = window.chartInstances["chart-sankey"];
  if (!inst) return;
  const entries = window.filteredEntries ? window.filteredEntries() : CORPUS.entries;
  if (sankeyTerm && !entries.some((e) => e.source_text === sankeyTerm)) {
    sankeyTerm = null;
    const input = document.getElementById("sankey-term");
    if (input) input.value = "";
  }
  if (!sankeyTerm) {
    sankeyTerm = pickDefaultTerm(entries);
    const input = document.getElementById("sankey-term");
    if (input) input.value = sankeyTerm || "";
  }
  inst.setOption(sankeyPreviewOption(entries), true);
}

function renderWordcloudThumb() {
  const inst = window.chartInstances["chart-wordcloud"];
  if (!inst || !window.filteredEntries) return;
  inst.setOption(wordcloudOption(window.filteredEntries(), true), true);
}

function renderThumbs() {
  networkTerms = null;
  renderNetworkThumb();
  renderSankeyThumb();
  renderWordcloudThumb();
}

function searchSankeyTerm() {
  const input = document.getElementById("sankey-term");
  const q = (input.value || "").trim().toLowerCase();
  if (!q) return;
  let hit = CORPUS.entries.find((e) => e.source_text.toLowerCase() === q);
  if (!hit) hit = CORPUS.entries.find((e) => e.source_text.toLowerCase().startsWith(q));
  if (!hit) hit = CORPUS.entries.find((e) => e.source_text.toLowerCase().includes(q));
  if (hit) {
    sankeyTerm = hit.source_text;
    input.value = hit.source_text;
    renderSankeyThumb();
  }
}

function renderModal() {
  if (!modalInstance || !currentChartId || !window.filteredEntries) return;
  const entries = window.filteredEntries();
  if (currentChartId === "network") {
    modalInstance.setOption(
      networkOption(entries, Number(document.getElementById("net-min").value), Number(document.getElementById("net-top").value), false),
      true,
    );
  } else if (currentChartId === "sankey") {
    modalInstance.setOption(
      sankeyOption(entries, Number(document.getElementById("sankey-min").value), 40, false),
      true,
    );
  } else {
    modalInstance.setOption(wordcloudOption(entries, false), true);
  }
}

function ensureModalInstance() {
  if (modalInstance) return;
  modalInstance = echarts.init(document.getElementById("chart-modal-main"));
  modalInstance.on("click", (p) => {
    if (currentChartId === "network") {
      if (p.dataType === "node") setSearchTerm(p.name);
    } else if (currentChartId === "sankey") {
      if (p.dataType === "node") setSearchTerm(p.name);
      else if (p.dataType === "edge") setSearchTerm(p.data.source);
    } else if (currentChartId === "wordcloud") {
      if (p.name) setSearchTerm(p.name);
    }
  });
}

function openModal(id) {
  currentChartId = id;
  document.getElementById("chart-modal").hidden = false;
  document.getElementById("controls-network").hidden = id !== "network";
  document.getElementById("controls-sankey").hidden = id !== "sankey";
  document.getElementById("modal-title").textContent = I18N.t("chart." + id + ".title");
  document.getElementById("modal-caption").textContent = I18N.t("chart." + id + ".caption");
  ensureModalInstance();
  modalInstance.resize();
  renderModal();
}

function closeModal() {
  document.getElementById("chart-modal").hidden = true;
  if (modalInstance) modalInstance.resize();
}

window.initCharts = function initCharts() {
  if (typeof echarts === "undefined") {
    ["chart-network", "chart-sankey", "chart-wordcloud"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = "";
        const p = document.createElement("p");
        p.className = "empty";
        p.textContent = "Visualizations require an internet connection.";
        el.appendChild(p);
      }
    });
    return;
  }

  ["chart-network", "chart-sankey", "chart-wordcloud"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) window.chartInstances[id] = echarts.init(el);
  });

  document.querySelectorAll(".chart-card").forEach((card) => {
    const open = () => openModal(card.dataset.chart);
    card.addEventListener("click", (e) => {
      if (e.target.closest(".chart-pick")) return;
      open();
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.target.closest(".chart-pick")) return;
        e.preventDefault();
        open();
      }
    });
    const btn = card.querySelector(".chart-open");
    if (btn) btn.addEventListener("click", (e) => { e.stopPropagation(); open(); });
  });

  const networkRandom = document.getElementById("network-random");
  if (networkRandom) {
    networkRandom.addEventListener("click", () => {
      networkTerms = pickRandomNetworkTerms(window.filteredEntries());
      renderNetworkThumb();
    });
  }

  buildSankeyDatalist();
  sankeyTerm = pickDefaultSankeyTerm();
  const sankeyInput = document.getElementById("sankey-term");
  if (sankeyInput && sankeyTerm) sankeyInput.value = sankeyTerm;
  if (sankeyInput) {
    sankeyInput.addEventListener("input", () => {
      const v = sankeyInput.value.trim().toLowerCase();
      const hit = v && CORPUS.entries.find((e) => e.source_text.toLowerCase() === v);
      if (hit) {
        sankeyTerm = hit.source_text;
        renderSankeyThumb();
      }
    });
    sankeyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchSankeyTerm();
      }
    });
  }
  const searchBtn = document.getElementById("sankey-search");
  if (searchBtn) {
    searchBtn.addEventListener("click", searchSankeyTerm);
  }
  const randomBtn = document.getElementById("sankey-random");
  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      sankeyTerm = pickDefaultSankeyTerm();
      if (sankeyInput && sankeyTerm) sankeyInput.value = sankeyTerm;
      renderSankeyThumb();
    });
  }

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  ["net-min", "net-top", "sankey-min"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const out = document.getElementById(id + "-out");
    el.addEventListener("input", () => {
      if (out) out.textContent = el.value;
      renderModal();
    });
  });

  window.addEventListener("resize", () => {
    Object.values(window.chartInstances).forEach((c) => c.resize());
    if (modalInstance) modalInstance.resize();
  });

  ensureModalInstance();
  renderThumbs();
};

window.renderCharts = function renderCharts() {
  if (!window.filteredEntries) return;
  renderThumbs();
  renderModal();
};
