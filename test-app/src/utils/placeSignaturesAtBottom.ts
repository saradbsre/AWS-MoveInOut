// Puts the signature boxes at the bottom of the LAST printed page.
// - If they fit on the last page of the report, they are pushed down to its bottom.
// - If they don't fit, they move to a new page (bottom aligned) and the
//   "intentionally left blank" note shows in the middle of that page.
// Returns a cleanup function; call it after printing.
//
// Page geometry must match the @page rule in Moveinout.css:
//   A4, margins 10mm (sides/top) and 20mm (bottom)  ->  190mm x 267mm usable.
export function placeSignaturesAtBottom(): () => void {
  const container = document.querySelector('.print-container') as HTMLElement | null;
  const sig = container?.querySelector('.signature-page-bottom') as HTMLElement | null;
  const row = sig?.querySelector('.signatures-bottom') as HTMLElement | null;
  if (!container || !sig || !row) return () => {};

  const reset = () => {
    sig.classList.remove('sig-own-page');
    sig.style.marginTop = '';
  };
  reset();

  // 1mm in pixels
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;height:100mm;width:1px;';
  document.body.appendChild(probe);
  const mm = probe.offsetHeight / 100;
  document.body.removeChild(probe);

  const PAGE_W = 190 * mm;
  const PAGE_H = 267 * mm;
  const GAP = 8 * mm; // safety space kept under the boxes

  // Measure the way it will print: full usable page width, no top padding
  const prev = { width: container.style.width, padding: container.style.padding };
  container.style.width = `${PAGE_W}px`;
  container.style.padding = '0';

  const sigTop = sig.getBoundingClientRect().top - container.getBoundingClientRect().top;
  const sigH = row.getBoundingClientRect().height;

  container.style.width = prev.width;
  container.style.padding = prev.padding;

  const usedOnLastPage = sigTop % PAGE_H;

  if (usedOnLastPage + sigH + GAP <= PAGE_H) {
    // Fits on the last page: push the boxes down to the bottom of that page
    sig.style.marginTop = `${Math.max(0, PAGE_H - usedOnLastPage - sigH - GAP)}px`;
  } else {
    // No room: boxes go to a new page, bottom aligned, blank note in the middle
    sig.classList.add('sig-own-page');
  }
  return reset;
}
