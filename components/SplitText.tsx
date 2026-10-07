// Splits text into masked words/chars so GSAP can slide them in.
export default function SplitText({
  text,
  by = "word",
  className = "",
  itemClass = "",
}: {
  text: string;
  by?: "word" | "char";
  className?: string;
  itemClass?: string;
}) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="line-mask" aria-hidden>
          {by === "word" ? (
            <span className={`inline-block ${itemClass}`}>{word}</span>
          ) : (
            word.split("").map((c, ci) => (
              <span key={ci} className={`inline-block ${itemClass}`}>
                {c}
              </span>
            ))
          )}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}
