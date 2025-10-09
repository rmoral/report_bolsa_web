type Props = { rating: 1 | 2 | 3 | 4 | 5; className?: string };

export default function Stars({ rating, className }: Props) {
  const stars = Array.from({ length: 5 }, (_, i) => i < rating);
  return (
    <div className={className} aria-label={`${rating} de 5`} role="img">
      {stars.map((filled, idx) => (
        <svg
          key={idx}
          width="18"
          height="18"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-block mr-0.5"
        >
          <path
            d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1 1 5.81L10 14.9l-5.21 2.73 1-5.81L1.58 7.62l5.82-.85L10 1.5z"
            fill={filled ? "#2ECC71" : "#E5E7EB"}
          />
        </svg>
      ))}
    </div>
  );
}


