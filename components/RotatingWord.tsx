"use client";

import { useEffect, useState } from "react";

// The hero headline cycles through the kinds of data we pull. Each change
// remounts the span (via key) so the CSS "word-in" animation replays.
const WORDS = [
  "web data",
  "pricing data",
  "job listings",
  "real estate data",
  "LinkedIn data",
];

export default function RotatingWord({ interval = 2600 }: { interval?: number }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % WORDS.length), interval);
    return () => clearInterval(id);
  }, [interval]);

  return (
    <span key={i} className="ab-word">
      {WORDS[i]}
    </span>
  );
}
