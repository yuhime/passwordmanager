import React, { useEffect, useState } from "react";

const CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*";

function getRandomChar() {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

type HackerDecryptProps = {
  target: string;
  speed?: number; // ms per cambio carattere casuale
};

export const HackerDecrypt: React.FC<HackerDecryptProps> = ({
  target,
  speed = 50,
}) => {
  const [displayed, setDisplayed] = useState<string[]>(() =>
    Array(target.length).fill(""),
  );
  const [fixedIndex, setFixedIndex] = useState(0);

  useEffect(() => {
    if (fixedIndex >= target.length) return;

    const interval = setInterval(() => {
      setDisplayed((prev) => {
        const newDisplay = [...prev];
        for (let i = fixedIndex; i < target.length; i++) {
          newDisplay[i] = getRandomChar();
        }
        return newDisplay;
      });
    }, speed);

    // fissa una lettera ogni 200ms
    const fixTimeout = setTimeout(() => {
      setDisplayed((prev) => {
        const newDisplay = [...prev];
        newDisplay[fixedIndex] = target[fixedIndex];
        return newDisplay;
      });
      setFixedIndex((i) => i + 1);
    }, 200);

    return () => {
      clearInterval(interval);
      clearTimeout(fixTimeout);
    };
  }, [fixedIndex, target, speed]);

  return (
    <div className="font-mono text-green-400 bg-black p-4 rounded-md select-none text-xl tracking-widest">
      {displayed.map((char, i) => (
        <span
          key={i}
          className={`inline-block ${
            char === target[i]
              ? "text-green-300 font-bold drop-shadow-[0_0_6px_#00ff00]"
              : "text-green-600"
          }`}
        >
          {char || getRandomChar()}
        </span>
      ))}
    </div>
  );
};
