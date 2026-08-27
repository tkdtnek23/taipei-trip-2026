type ChevronIconProps = {
  direction: "up" | "down";
};

export default function ChevronIcon({ direction }: ChevronIconProps) {
  return (
    <svg className="chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={direction === "up"
          ? "M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41Z"
          : "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z"}
      />
    </svg>
  );
}
