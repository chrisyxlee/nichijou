let toTopButton = document.getElementById("back-to-top");

window.onscroll = function () {
  maybeShowBackToTopButton();
};

function maybeShowBackToTopButton() {
  var PIXELS_FROM_TOP = 100;

  if (
    (document.body.scrollTop > PIXELS_FROM_TOP ||
      document.documentElement.scrollTop > PIXELS_FROM_TOP) &&
    (document.body.style.overflow === undefined ||
      document.body.style.overflow === "" ||
      document.body.style.overflow === "scroll")
  ) {
    toTopButton.style.display = "block";
  } else {
    toTopButton.style.display = "none";
  }
}

function scrollToTop() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
