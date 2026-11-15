import type { MuscleId } from "../data/exercises";
const zones: Record<MuscleId, string> = {
  chest: "M17 20Q21 18 25 20V26Q20 28 17 25ZM27 20Q31 18 35 20V25Q31 28 27 26Z",
  back: "M18 20L25 22V33L20 30ZM27 22L34 20L32 30L27 33Z",
  shoulders: "M14 19Q18 16 20 20L18 24L13 23ZM32 20Q34 16 38 19L39 23L34 24Z",
  biceps: "M12 25L17 26L15 33L10 32ZM35 26L40 25L42 32L37 33Z",
  triceps: "M13 24L17 25L15 33L11 31ZM35 25L39 24L41 31L37 33Z",
  abs: "M22 28H30V39H22Z",
  quads: "M18 41L24 43L23 55L17 55ZM28 43L34 41L35 55L29 55Z",
  hamstrings: "M18 42L24 43L23 55L17 55ZM28 43L34 42L35 55L29 55Z",
  glutes: "M18 36L25 37V44L18 43ZM27 37L34 36V43L27 44Z",
  calves: "M18 57L23 57L22 65L18 66ZM29 57L34 57L34 66L30 65Z",
};
export default function MuscleGlyph({ muscles }: { muscles: MuscleId[] }) {
  return (
    <svg
      viewBox="0 0 52 74"
      width="35"
      height="50"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21 14C18 11 19 4 23 3H29C33 4 34 11 31 14L32 17L38 19L41 25L43 36L46 43L43 45L39 37L35 28L34 36L36 43L36 55L35 68L37 71H30L28 57L26 46L24 57L22 71H15L17 68L16 55L16 43L18 36L17 28L13 37L9 45L6 43L9 36L11 25L14 19L20 17Z"
        stroke="#92999c"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {muscles.map((id) => (
        <path key={id} d={zones[id]} fill="#c5ee57" />
      ))}
      <path d="M26 20V39M18 35L26 39L34 35" stroke="#b8bec0" strokeWidth=".6" />
    </svg>
  );
}
