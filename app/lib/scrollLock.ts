/** Freezes the page behind a dialog without letting it jump sideways.
 *
 *  `overflow: hidden` alone takes the scrollbar away, and the ~15px it occupied
 *  goes straight back to the layout — the whole page shifts the moment a modal
 *  opens. Measuring the gap and padding by exactly that much replaces the
 *  scrollbar with empty space of the same width.
 *
 *  Measured rather than assumed: the gap is 0 on a page that does not scroll and
 *  on any platform with overlay scrollbars, and padding those would cause the
 *  very shift this exists to prevent. */
export function lockScroll(): () => void {
  const body = document.body;
  const previousOverflow = body.style.overflow;
  const previousPadding = body.style.paddingRight;

  const gap = window.innerWidth - document.documentElement.clientWidth;

  body.style.overflow = "hidden";
  if (gap > 0) body.style.paddingRight = `${gap}px`;

  return () => {
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPadding;
  };
}
