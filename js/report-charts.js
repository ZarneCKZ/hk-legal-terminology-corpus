(function () {
  function aggregateTerms(list) {
    const map = new Map();
    list.forEach((e) => {
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

  function networkOption(list, min, top) {
    const terms = aggregateTerms(list)
      .filter((t) => t.count >= min)
      .sort((a, b) => b.count - a.count)
      .slice(0, top);
    const nodeMap = new Map();
    const links = [];
    terms.forEach((t) => {
      if (!nodeMap.has(t.term)) {
        nodeMap.set(t.term, {
          name: t.term,
          category: 0,
          symbolSize: Math.min(16 + t.renderings.length * 5, 46),
        });
      }
      t.renderings.forEach((r) => {
        if (!nodeMap.has(r)) nodeMap.set(r, { name: r, category: 1, symbolSize: 12 });
        links.push({ source: t.term, target: r });
      });
    });
    return {
      tooltip: {
        formatter: (p) =>
          p.dataType === "node" ? p.name : p.data.source + " → " + p.data.target,
      },
      legend: [{ data: ["English term", "Chinese rendering"], top: 0 }],
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          draggable: true,
          data: [...nodeMap.values()],
          links,
          categories: [
            { name: "English term", itemStyle: { color: "#1f4e78" } },
            { name: "Chinese rendering", itemStyle: { color: "#b3563a" } },
          ],
          label: { show: true, position: "right", fontSize: 11, color: "#333" },
          force: { repulsion: 180, edgeLength: 65, gravity: 0.08 },
          emphasis: { focus: "adjacency", lineStyle: { width: 3 } },
          lineStyle: { color: "#c7d2dc", width: 1, curveness: 0.08 },
        },
      ],
    };
  }

  function sankeyOption(term) {
    const entry = (window.CORPUS_DATA.entries || []).find((e) => e.source_text === term);
    const renderings = entry ? entry.renderings : [];
    const nodes = [{ name: term, depth: 0 }];
    const links = [];
    renderings.forEach((r) => {
      nodes.push({ name: r, depth: 1 });
      links.push({ source: term, target: r, value: 1 });
    });
    return {
      tooltip: {
        formatter: (p) =>
          p.dataType === "edge" ? p.data.source + " → " + p.data.target : p.name,
      },
      series: [
        {
          type: "sankey",
          data: nodes,
          links,
          left: 8,
          right: 170,
          top: 8,
          bottom: 8,
          nodeWidth: 12,
          nodeGap: 8,
          layoutIterations: 48,
          label: { fontSize: 11, color: "#333" },
          lineStyle: { color: "gradient", curveness: 0.5, opacity: 0.3 },
          emphasis: { focus: "adjacency" },
        },
      ],
    };
  }

  function wordcloudOption(list) {
    const m = new Map();
    list.forEach((e) => {
      m.set(e.key_term, Math.max(m.get(e.key_term) || 0, e.renderings_count));
    });
    const data = [...m.entries()]
      .filter(([, v]) => v >= 2)
      .map(([name, value]) => ({ name, value }));
    const colors = ["#1f4e78", "#b3563a", "#2e7d5b", "#8a5a12", "#6b4fa0"];
    return {
      tooltip: { show: true, formatter: (p) => p.name + " · " + p.value + " rendering(s)" },
      series: [
        {
          type: "wordCloud",
          shape: "circle",
          sizeRange: [14, 64],
          rotationRange: [0, 0],
          gridSize: 10,
          drawOutOfBound: false,
          layoutAnimation: true,
          textStyle: {
            fontFamily: "sans-serif",
            color: () => colors[Math.floor(Math.random() * colors.length)],
          },
          data,
        },
      ],
    };
  }

  function render() {
    if (typeof echarts === "undefined") return;
    const entries = (window.CORPUS_DATA && window.CORPUS_DATA.entries) || [];
    const net = echarts.init(document.getElementById("report-network"));
    const sankey = echarts.init(document.getElementById("report-sankey"));
    const wordcloud = echarts.init(document.getElementById("report-wordcloud"));
    net.setOption(networkOption(entries, 2, 24));
    sankey.setOption(sankeyOption("information"));
    wordcloud.setOption(wordcloudOption(entries));
    window.addEventListener("resize", () => {
      net.resize();
      sankey.resize();
      wordcloud.resize();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
