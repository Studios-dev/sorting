import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { type Algorithm, type SortStep } from "../algorithms.ts";

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
  return cn(
    "bar flex-1 rounded-lg transition-all duration-300 ease-out",
    step.eliminated?.includes(index) && "bg-neutral-800 opacity-20",
    !step.eliminated?.includes(index) && step.active?.includes(index) && "bg-neutral-400",
    !step.eliminated?.includes(index) &&
      !step.active?.includes(index) &&
      step.sorted?.includes(index) &&
      "bg-neutral-200",
    !step.eliminated?.includes(index) &&
      !step.active?.includes(index) &&
      !step.sorted?.includes(index) &&
      "bg-neutral-700",
  );
}

export default function AlgorithmCard({ algorithm }: { algorithm: Algorithm }) {
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
  }, []);

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
      <h2 className="text-xl font-bold text-white lowercase tracking-tight text-center mb-1">
        {algorithm.name}
      </h2>
      <p className="text-center text-neutral-500 text-sm mb-3">{algorithm.tagline}</p>
      <div className="flex justify-center gap-2 mb-8">
        <span className="text-xs text-neutral-600 bg-neutral-800/60 font-bold px-2.5 py-1 rounded-lg">
          time: {algorithm.timeComplexity}
        </span>
        <span className="text-xs text-neutral-600 bg-neutral-800/60 font-bold px-2.5 py-1 rounded-lg">
          space: {algorithm.spaceComplexity}
        </span>
      </div>

      {hasThinking && cardState.thinkingLines.length > 0 ? (
        <div
          ref={thinkingRef}
          className="text-[10px] leading-[1.6] text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-lg p-3 mb-6 max-h-[80px] overflow-y-auto"
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

      <div className="text-[11px] text-neutral-600 text-center h-4 mb-8 truncate">
        {cardState.status || "\u00A0"}
      </div>

      <div className="flex justify-center gap-3 text-sm font-bold">
        <Button
          onClick={() => {
            void runSort();
          }}
          disabled={cardState.isSorting}
          className={cn(cardState.isSorting && "cursor-wait")}
        >
          {cardState.isSorting ? "sorting..." : "sort"}
        </Button>
        <Button variant="secondary" onClick={shuffle}>
          shuffle
        </Button>
      </div>
    </section>
  );
}
