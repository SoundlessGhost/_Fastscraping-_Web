/// The Fastscraping "Tile F" mark: a lavender tile, five ink squares down the
/// left and two ultraviolet arms that run past the tile's edge. Drawn on a
/// 100-unit grid so it scales cleanly at any size.
export default function BrandMark({ size = 36, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg
      width={size * 1.2}
      height={size}
      viewBox="0 0 120 100"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", overflow: "visible" }}
    >
      <rect x="0" y="0" width="100" height="100" rx="16" fill={dark ? "#ECEAF8" : "#ECEAF8"} />
      {[10, 27, 44, 61, 78].map((y) => (
        <rect key={y} x="22" y={y} width="12" height="12" fill="#16131F" />
      ))}
      <rect x="22" y="12" width="96" height="10" fill="#4B3FA3" />
      <rect x="22" y="46" width="74" height="10" fill="#4B3FA3" />
    </svg>
  );
}
