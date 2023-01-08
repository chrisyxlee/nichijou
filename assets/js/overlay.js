function closeOverlay(id) {
  document.getElementById(id).style.width = "0%";
  document.body.style.overflow = "scroll";
  maybeShowBackToTopButton();
}

function openOverlay(id) {
  document.getElementById(id).style.width = "100%";
  document.body.style.overflow = "hidden";
  maybeShowBackToTopButton();
}
