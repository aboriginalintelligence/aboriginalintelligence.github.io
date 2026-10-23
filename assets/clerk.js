(function () {
  var box = document.getElementById("clerk-log");
  var form = document.getElementById("clerk-form");
  var input = document.getElementById("clerk-q");
  var passages = [];

  function add(role, html) {
    var art = document.createElement("article");
    art.className = "bubble " + role;
    art.innerHTML = html;
    box.appendChild(art);
    box.scrollTop = box.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tokens(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, " ")
      .split(/\s+/)
      .filter(function (w) { return w.length > 1; });
  }

  function score(qTokens, row) {
    var hay = (row.title + " " + row.tags + " " + row.text).toLowerCase();
    var n = 0;
    qTokens.forEach(function (w) {
      if (hay.indexOf(w) !== -1) n += w.length > 4 ? 3 : 2;
    });
    var title = (row.title || "").toLowerCase();
    qTokens.forEach(function (w) {
      if (title.indexOf(w) !== -1) n += 4;
    });
    return n;
  }

  function answer(question) {
    var qTokens = tokens(question);
    if (!qTokens.length) {
      return "<p>Type a question about money, elections, by-laws, or the drafts on this site.</p>";
    }
    var ranked = passages.map(function (row) {
      return { row: row, n: score(qTokens, row) };
    }).filter(function (x) { return x.n > 3; });
    ranked.sort(function (a, b) { return b.n - a.n; });
    if (!ranked.length) {
      return "<p>I do not have a sourced passage for that. Try money, FNFTA, FAL, elections, section 81, section 83, membership, or the drafts on this site. I will not guess a section number.</p>";
    }
    var top = ranked.slice(0, 2);
    var html = "";
    top.forEach(function (item, i) {
      var row = item.row;
      html += "<p>" + escapeHtml(row.text) + "</p>";
      html += "<p class=\"cite\">Source. " + escapeHtml(row.source);
      if (row.url) {
        html += " <a href=\"" + escapeHtml(row.url) + "\">Open</a>";
      }
      html += "</p>";
      if (i === 0 && top.length > 1) html += "<p class=\"fine\">Related.</p>";
    });
    html += "<p class=\"fine\">Not a lawyer. Drafts on this site are not in force until members adopt them.</p>";
    return html;
  }

  function ask(question) {
    var q = String(question || "").trim();
    if (!q) return;
    add("me", "<p>" + escapeHtml(q) + "</p>");
    add("bot", answer(q));
  }

  fetch("./assets/knowledge.json")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      passages = data || [];
      add("bot", "<p>Band Clerk. Ask about reserve law, band money, elections, and how council is supposed to work. I answer from public statutes and from the drafts on this site. I am not a lawyer. I will not name people or take a complaint.</p>");
    })
    .catch(function () {
      add("bot", "<p>The library file did not load. Refresh the page.</p>");
    });

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var q = input.value.trim();
      input.value = "";
      ask(q);
    });
  }

  document.querySelectorAll("[data-ask]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      ask(btn.getAttribute("data-ask"));
    });
  });
})();
