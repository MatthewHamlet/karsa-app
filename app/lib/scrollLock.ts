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
