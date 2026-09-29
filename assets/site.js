(function () {
  var REPO = "aboriginalintelligence/aboriginalintelligence.github.io";

  // theme toggle: remembers the choice on this device only
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  } catch (e) {}
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme") === "dark" ||
        (!root.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
      var next = dark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // open the contents list on wide screens only
  var toc = document.querySelector("details.toc");
  if (toc && window.matchMedia("(min-width: 980px)").matches) toc.open = true;

  // comments: stored as GitHub issues in the site repository
  document.querySelectorAll("[data-doc]").forEach(function (box) {
    var slug = box.getAttribute("data-doc");
    var title = box.getAttribute("data-title");
    var label = "doc:" + slug;
    var issueTitle = "Comment on " + title;
    var list = box.querySelector(".comment-list");
    var form = box.querySelector("form");

    function line(text) {
      var p = document.createElement("p");
      p.className = "fine";
      p.textContent = text;
      return p;
    }

    // labels can only be set by repo collaborators, so match by title as well
    function matches(issue) {
      if (issue.pull_request) return false;
      var byLabel = (issue.labels || []).some(function (l) { return l && l.name === label; });
      var byTitle = (issue.title || "").trim().toLowerCase() === issueTitle.toLowerCase();
      return byLabel || byTitle;
    }

    fetch("https://api.github.com/repos/" + REPO + "/issues?state=all&per_page=100", {
      headers: { Accept: "application/vnd.github+json" }
    }).then(function (res) {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    }).then(function (issues) {
      var rows = (issues || []).filter(matches);
      rows.sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
      list.textContent = "";
      if (!rows.length) {
        list.appendChild(line("No comments yet."));
        return;
      }
      rows.forEach(function (issue) {
        var item = document.createElement("article");
        item.className = "comment";
        var who = document.createElement("div");
        who.className = "who";
        who.textContent = issue.user && issue.user.login ? issue.user.login : "Member";
        var when = document.createElement("div");
        when.className = "when";
        when.textContent = (issue.created_at || "").slice(0, 10);
        var body = document.createElement("p");
        body.textContent = (issue.body || "").replace(/\n*Posted from the document page\.\s*$/, "");
        item.appendChild(who);
        item.appendChild(when);
        item.appendChild(body);
        if (issue.html_url) {
          var more = document.createElement("a");
          more.href = issue.html_url;
          more.textContent = "Open this comment";
          item.appendChild(more);
        }
        list.appendChild(item);
      });
    }).catch(function () {
      list.textContent = "";
      list.appendChild(line("Earlier comments could not be loaded. You can still post one."));
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = form.elements.name.value.trim();
      var comment = form.elements.comment.value.trim();
      if (comment.length < 2) return;
      var body = "Name: " + (name || "Not given") + "\n\n" + comment + "\n\nPosted from the document page.";
      var href = "https://github.com/" + REPO + "/issues/new?labels=" + encodeURIComponent(label)
        + "&title=" + encodeURIComponent(issueTitle)
        + "&body=" + encodeURIComponent(body);
      window.location.href = href;
    });
  });
})();
