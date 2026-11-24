window.I18N = {
  defaultLang: "en",
  lang: "en",
  strings: {
    en: {
      title: "HK Legal Terminology Corpus Explorer",
      subtitle: "One English legal term, many Chinese renderings",
      "nav.explorer": "Explorer",
      "nav.report": "Report",
      "nav.codebook": "Codebook",
      "nav.ai": "AI Use Declaration",
      "search.label": "Search",
      "search.placeholder": "Search English or Chinese text or keyword",
      "filter.all": "All",
      "filter.category": "Category",
      "filter.checked": "Human checked",
      "filter.unit": "Unit",
      reset: "Reset",
      "table.title": "Entries",
      "table.export": "Export CSV",
      "table.col.source_text": "Source text",
      "table.col.target_text": "Target text",
      "table.col.key_term": "Key term",
      "table.col.category": "Category",
      "table.col.human_checked": "Human checked",
      "table.col.unit": "Unit",
      "table.col.source": "Source",
      "chart.network.caption": "Which English terms branch into the most Chinese renderings?",
      "chart.network.title": "Network graph",
      "chart.network.min": "Min renderings",
      "chart.network.top": "Top terms",
      "chart.legend.en": "English term",
      "chart.legend.zh": "Chinese rendering",
      "chart.open": "Open full screen",
      "chart.random": "Random",
      "chart.search": "Search",
      "chart.sankey.caption": "How do English terms flow into their Chinese renderings?",
      "chart.sankey.title": "Sankey diagram",
      "chart.sankey.min": "Min renderings",
      "chart.sankey.search.placeholder": "Pick or search a word",
      "chart.sankey.random": "Random",
      "chart.heatmap.caption": "How does rendering multiplicity distribute across term types?",
      "chart.heatmap.title": "Heatmap",
      "chart.wordcloud.caption": "Which words have the most Chinese renderings?",
      "chart.wordcloud.title": "Word cloud",
      "footer.label": "Built with data from the Hong Kong Department of Justice English-Chinese Glossary of Legal Terms (open data). Source:",
      "footer.link": "glossary.doj.gov.hk",
      "cat.one_to_one": "One-to-one",
      "cat.one_to_many": "One-to-many (2–3)",
      "cat.polysemous": "Polysemous (4+)",
      "unit.term": "term",
      "unit.phrase": "phrase",
      "yes": "yes",
      "no": "no",
      "results": "Showing {n} of {total} entries",
    },
    "zh-Hant": {
      title: "香港法律詞彙語料探索器",
      subtitle: "同一英文法律術語，多種中文譯名",
      "nav.explorer": "探索器",
      "nav.report": "報告",
      "nav.codebook": "編碼手冊",
      "nav.ai": "AI 使用聲明",
      "search.label": "搜尋",
      "search.placeholder": "搜尋英文或中文文字或關鍵詞",
      "filter.all": "全部",
      "filter.category": "分類",
      "filter.checked": "人工核對",
      "filter.unit": "類型",
      reset: "重設",
      "table.title": "條目",
      "table.export": "匯出 CSV",
      "table.col.source_text": "原文",
      "table.col.target_text": "譯文",
      "table.col.key_term": "關鍵詞",
      "table.col.category": "分類",
      "table.col.human_checked": "人工核對",
      "table.col.unit": "類型",
      "table.col.source": "來源",
      "chart.network.caption": "哪些英文術語分支出最多的中文譯名？",
      "chart.network.title": "網絡圖",
      "chart.network.min": "最少譯名數",
      "chart.network.top": "前幾個詞",
      "chart.legend.en": "英文術語",
      "chart.legend.zh": "中文譯名",
      "chart.open": "開啟大圖",
      "chart.random": "隨機",
      "chart.search": "搜尋",
      "chart.sankey.caption": "英文術語如何流向其中文譯名？",
      "chart.sankey.title": "桑基圖",
      "chart.sankey.min": "最少譯名數",
      "chart.sankey.search.placeholder": "選擇或搜尋詞語",
      "chart.sankey.random": "隨機",
      "chart.heatmap.caption": "譯名多樣性如何在術語類型之間分佈？",
      "chart.heatmap.title": "熱力圖",
      "chart.wordcloud.caption": "哪些詞的中文譯名最多？",
      "chart.wordcloud.title": "詞雲",
      "footer.label": "資料來自香港律政司《英漢法律詞彙》（公開數據）。來源：",
      "footer.link": "glossary.doj.gov.hk",
      "cat.one_to_one": "單一譯法",
      "cat.one_to_many": "多譯（2–3 種）",
      "cat.polysemous": "高度多譯（4 種或以上）",
      "unit.term": "術語",
      "unit.phrase": "短語",
      "yes": "是",
      "no": "否",
      "results": "顯示 {total} 條中的 {n} 條",
    },
  },

  t(key) {
    const table = this.strings[this.lang] || this.strings[this.defaultLang];
    return table[key] !== undefined ? table[key] : key;
  },

  apply() {
    document.documentElement.lang = this.lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = this.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      el.placeholder = this.t(el.getAttribute("data-i18n-ph"));
    });
    document.querySelectorAll("[data-lang]").forEach((el) => {
      el.hidden = el.getAttribute("data-lang") !== this.lang;
    });
    const toggle = document.getElementById("lang-toggle");
    if (toggle) toggle.textContent = this.lang === "en" ? "繁體中文" : "English";
  },

  setLang(lang) {
    this.lang = lang;
    try { localStorage.setItem("lang", lang); } catch (_) {}
    this.apply();
    if (window.renderApp) window.renderApp();
  },
};

document.addEventListener("DOMContentLoaded", () => {
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (_) {}
  I18N.lang = saved === "zh-Hant" ? "zh-Hant" : I18N.defaultLang;
  I18N.apply();
  const toggle = document.getElementById("lang-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      I18N.setLang(I18N.lang === "en" ? "zh-Hant" : "en");
    });
  }
});
