/* Shared by every concept page. */
(function () {
  var d = document.documentElement;
  if (location.search.indexOf("wall") > -1) d.classList.add("on-wall");
  /* entrance motion starts once fonts are in, so nothing jumps */
  var go = function () { d.classList.add("ready"); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  setTimeout(go, 900);
  /* on the homepage wall the parent page pauses screens nobody can see, to save the computer's effort */
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || typeof e.data.wallPlay !== "boolean") return;
    d.classList.toggle("wall-paused", !e.data.wallPlay);
  });
  /* a photo that cannot load leaves its tone behind instead of a broken icon */
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG") t.classList.add("broken");
  }, true);
})();
