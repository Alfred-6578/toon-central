// The printed edge of film stock: maker and frame numbers along the outer edge of a .filmstrip band.
const PRINT = Array.from({ length: 24 }, (_, i) => `TOON CENTRAL ▸ ${String(i * 2 + 12).padStart(2, "0")}A`).join("     ");

export function FilmEdge() {
  return (
    <>
      <span aria-hidden="true" className="film-edge pointer-events-none absolute inset-x-0 top-[3px]">{PRINT}</span>
      <span aria-hidden="true" className="film-edge pointer-events-none absolute inset-x-0 bottom-[3px]">{PRINT}</span>
    </>
  );
}
