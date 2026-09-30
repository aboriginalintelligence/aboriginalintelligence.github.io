
(function () {
  var REPO = "aboriginalintelligence/aboriginalintelligence.github.io";
  function applyLayout() {
    var wide = window.matchMedia("(min-width: 900px)").matches;
    document.documentElement.setAttribute("data-layout", wide ? "desk" : "phone");
  }
  applyLayout();
  window.addEventListener("resize", applyLayout);
  document.querySelectorAll("[data-doc]").forEach(function (box) {
    var slug = box.getAttribute("data-doc");
    var title = box.getAttribute("data-title");
    var label = "doc:" + slug;
    var list = box.querySelector(".comment-list");
    var form = box.querySelector("form");
    var approve = box.querySelector("[data-approve]");
    function line(text) {
      var p = document.createElement("p");
      p.className = "fine";
      p.textContent = text;
      return p;
    }
    fetch("https://api.github.com/repos/" + REPO + "/issues?state=all&per_page=50&labels=" + encodeURIComponent(label), {
      headers: { Accept: "application/vnd.github+json" }
    }).then(function (res) {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    }).then(function (issues) {
      var rows = (issues || []).filter(function (issue) { return !issue.pull_request; });
      rows.sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
      list.textContent = "";
      if (!rows.length) {
        list.appendChild(line("No comments yet."));
        return;
      }
      rows.forEach(function (issue) {
        var item = document.createElement("article");
        var text = issue.body || "";
        item.className = text.indexOf("I approve this document.") !== -1 ? "comment approval" : "comment";
        var who = document.createElement("div");
        who.className = "who";
        who.textContent = issue.user && issue.user.login ? issue.user.login : "Member";
        var when = document.createElement("div");
        when.className = "when";
        when.textContent = (issue.created_at || "").slice(0, 10);
        var body = document.createElement("p");
        body.textContent = text;
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
      var name = form.name.value.trim();
      var comment = form.comment.value.trim();
      if (comment.length < 2) return;
      var body = "Name: " + (name || "Not given") + "\n\n" + comment + "\n\nPosted from the document page.";
      var href = "https://github.com/" + REPO + "/issues/new?labels=" + encodeURIComponent(label)
        + "&title=" + encodeURIComponent("Comment on " + title)
        + "&body=" + encodeURIComponent(body);
      window.location.href = href;
    });
    if (approve) {
      approve.addEventListener("click", function () {
        var name = form.name.value.trim();
        var body = "Name: " + (name || "Not given") + "\n\nI approve this document.\n\nPosted from the document page.";
        var href = "https://github.com/" + REPO + "/issues/new?labels=" + encodeURIComponent(label)
          + "&title=" + encodeURIComponent("I approve " + title)
          + "&body=" + encodeURIComponent(body);
        window.location.href = href;
      });
    }
  });
})();
