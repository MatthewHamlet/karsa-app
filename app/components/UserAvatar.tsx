
export default function UserAvatar({
  url,
  initial,
  className = "",

  color,
}: {
  url?: string | null;
  initial: string;

  className?: string;
  color?: string;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white ${
        color ? "" : "bg-karsa"
      } ${className}`}
      style={color ? { backgroundColor: color } : undefined}
    >
      {url ? (

        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
