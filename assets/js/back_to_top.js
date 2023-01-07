let mybutton = document.getElementById("back-to-top");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  var PIXELS_FROM_TOP = 100;
  if (
    document.body.scrollTop > PIXELS_FROM_TOP ||
    document.documentElement.scrollTop > PIXELS_FROM_TOP
  ) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}
