// Ensure that the pixels in our font are always aligned to even numbers, avoiding weird subpixel-aliasing
// issues.
// Shoutout and eternal thanks to https://chitin.link/blog/pixel-font-alignment.
const updatePixelOffset = () =>
  document.body.style.paddingRight =
  window.innerWidth % 2 === 0 ? "1px" : "0px";

window.addEventListener("load", () => {
  window.addEventListener("resize", updatePixelOffset);
  updatePixelOffset();
});

