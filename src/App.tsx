import { useEffect, useRef, useState } from "react";
import { type Algorithm, algorithms, type SortStep } from "./algorithms.ts";

const BAR_COUNT = 12;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function shuffleArray(length: number): number[] {
  const array = Array.from({ length }, (_, index) => index + 1);

  for (let index = array.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }

  return array;
}

function getBarClass(index: number, step: SortStep): string {
  const baseClass = "bar flex-1 rounded-t-[3px] transition-all duration-300 ease-out";

  if (step.eliminated?.includes(index)) {
    return `${baseClass} bg-neutral-800 opacity-20`;
  }

  if (step.active?.includes(index)) {
    return `${baseClass} bg-neutral-400`;
  }

  if (step.sorted?.includes(index)) {
    return `${baseClass} bg-white`;
  }

  return `${baseClass} bg-neutral-700`;
}

function AlgorithmCard({ algorithm }: { algorithm: Algorithm }) {
  const [cardState, setCardState] = useState(() => {
    const initialArray = shuffleArray(BAR_COUNT);

    return {
      baseArray: initialArray,
      displayStep: { array: initialArray } satisfies SortStep,
      status: "",
      thinkingLines: [] as string[],
      isSorting: false,
    };
  });
  const runIdRef = useRef(0);
  const baseArrayRef = useRef(cardState.baseArray);
  const thinkingLineCountRef = useRef(0);
  const thinkingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const thinkingElement = thinkingRef.current;
    if (thinkingElement) {
      thinkingElement.scrollTop = thinkingElement.scrollHeight;
    }
  }, [cardState.thinkingLines]);

  async function typeThinking(text: string, runId: number): Promise<void> {
    const lineIndex = thinkingLineCountRef.current;
    thinkingLineCountRef.current += 1;

    setCardState((previous) => ({
      ...previous,
      thinkingLines: [...previous.thinkingLines, "> "],
    }));

    let currentLine = "> ";

    for (const char of text) {
      if (runIdRef.current !== runId) {
        return;
      }

      currentLine += char;
      setCardState((previous) => ({
        ...previous,
        thinkingLines: previous.thinkingLines.map((line, index) =>
          index === lineIndex ? currentLine : line,
        ),
      }));
      await wait(12);
    }
  }

  async function runSort(): Promise<void> {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    thinkingLineCountRef.current = 0;

    setCardState((previous) => ({
      ...previous,
      displayStep: { array: previous.baseArray },
      status: "",
      thinkingLines: [],
      isSorting: true,
    }));

    try {
      for await (const step of algorithm.sort([...baseArrayRef.current])) {
        if (runIdRef.current !== runId) {
          return;
        }

        setCardState((previous) => ({
          ...previous,
          displayStep: step,
          status: step.message ?? previous.status,
        }));

        if (step.thinking) {
          await typeThinking(step.thinking, runId);
        }

        if (runIdRef.current !== runId) {
          return;
        }

        if (step.delay && step.delay > 0) {
          await wait(step.delay);
        }
      }
    } catch (error) {
      console.error(`Sort error (${algorithm.id}):`, error);
    } finally {
      if (runIdRef.current === runId) {
        setCardState((previous) => ({
          ...previous,
          isSorting: false,
        }));
      }
    }
  }

  function shuffle(): void {
    const nextArray = shuffleArray(BAR_COUNT);

    runIdRef.current += 1;
    thinkingLineCountRef.current = 0;
    baseArrayRef.current = nextArray;

    setCardState({
      baseArray: nextArray,
      displayStep: { array: nextArray },
      status: "",
      thinkingLines: [],
      isSorting: false,
    });
  }

  const hasThinking = algorithm.id === "agentic";

  return (
    <section className="w-full max-w-md mx-auto" data-algo={algorithm.id}>
      <h2 className="font-mono text-xl font-bold text-white lowercase tracking-tight text-center mb-1">
        {algorithm.name}
      </h2>
      <p className="text-center text-neutral-500 text-sm mb-3">{algorithm.tagline}</p>
      <div className="flex justify-center gap-2 mb-8">
        <span className="font-mono text-[11px] text-neutral-600 bg-neutral-800/60 px-2.5 py-1 rounded-md">
          time: {algorithm.timeComplexity}
        </span>
        <span className="font-mono text-[11px] text-neutral-600 bg-neutral-800/60 px-2.5 py-1 rounded-md">
          space: {algorithm.spaceComplexity}
        </span>
      </div>

      {hasThinking && cardState.thinkingLines.length > 0 ? (
        <div
          ref={thinkingRef}
          className="font-mono text-[10px] leading-[1.6] text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-lg p-3 mb-6 max-h-[80px] overflow-y-auto"
        >
          {cardState.thinkingLines.map((line, index) => (
            <div key={`${algorithm.id}-thinking-${index}`} className="mb-1 last:mb-0">
              {line}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-end justify-center gap-1.5 h-[200px] mb-4">
        {cardState.displayStep.array.map((value, index) => (
          <div
            key={`${algorithm.id}-${index}-${value}`}
            className={getBarClass(index, cardState.displayStep)}
            style={{ height: `${value <= 0 ? 0 : (value / BAR_COUNT) * 100}%` }}
          />
        ))}
      </div>

      <div className="font-mono text-[11px] text-neutral-600 text-center h-4 mb-8 truncate">
        {cardState.status || "\u00A0"}
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            void runSort();
          }}
          disabled={cardState.isSorting}
          className="px-8 py-2.5 bg-white text-neutral-900 text-sm font-mono rounded-xl hover:bg-neutral-200 active:bg-neutral-300 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {cardState.isSorting ? "sorting..." : "sort"}
        </button>
        <button
          type="button"
          onClick={shuffle}
          className="px-6 py-2.5 border border-neutral-700 text-neutral-500 text-sm font-mono rounded-xl hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
        >
          shuffle
        </button>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen px-6 py-16">
      <header className="text-center mb-20">
        <h1 className="font-mono text-3xl font-bold text-white tracking-tighter">sorting</h1>
        <p className="text-neutral-600 text-sm mt-2 tracking-tight">
          a curated collection of perfectly legitimate sorting algorithms
        </p>
      </header>

      <div className="flex flex-col gap-28">
        {algorithms.map((algorithm) => (
          <AlgorithmCard key={algorithm.id} algorithm={algorithm} />
        ))}
      </div>
    </div>
  );
}
