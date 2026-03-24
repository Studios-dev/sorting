import { algorithms, type Algorithm, type SortStep } from "./algorithms.ts";
import "./style.css";

const BAR_COUNT = 12;

const cardArrays: Record<string, number[]> = {};
const runIds: Record<string, number> = {};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function shuffleArray(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

for (const algo of algorithms) {
  cardArrays[algo.id] = shuffleArray(BAR_COUNT);
}

function getBarsContainer(id: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-bars="${id}"]`)!;
}

function getStatusEl(id: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-status="${id}"]`)!;
}

function getThinkingEl(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-thinking="${id}"]`);
}

function createBars(id: string): void {
  const container = getBarsContainer(id);
  container.innerHTML = "";
  const array = cardArrays[id];

  for (const val of array) {
    const bar = document.createElement("div");
    bar.className =
      "bar flex-1 rounded-t-[3px] bg-neutral-700 transition-all duration-300 ease-out";
    bar.style.height = `${(val / BAR_COUNT) * 100}%`;
    container.appendChild(bar);
  }
}

function updateBars(id: string, step: SortStep): void {
  const container = getBarsContainer(id);
  const bars = container.children;
  const { array, active = [], sorted = [], eliminated = [] } = step;

  while (bars.length < array.length) {
    const bar = document.createElement("div");
    bar.className = "bar flex-1 rounded-t-[3px] transition-all duration-300 ease-out";
    container.appendChild(bar);
  }
  while (bars.length > array.length) {
    container.removeChild(container.lastChild!);
  }

  for (let i = 0; i < array.length; i++) {
    const bar = bars[i] as HTMLElement;
    const height = array[i] <= 0 ? 0 : (array[i] / BAR_COUNT) * 100;
    bar.style.height = `${height}%`;

    const base = "bar flex-1 rounded-t-[3px] transition-all duration-300 ease-out";

    if (eliminated.includes(i)) {
      bar.className = `${base} bg-neutral-800 opacity-20`;
    } else if (active.includes(i)) {
      bar.className = `${base} bg-neutral-400`;
    } else if (sorted.includes(i)) {
      bar.className = `${base} bg-white`;
    } else {
      bar.className = `${base} bg-neutral-700`;
    }
  }
}

function updateStatus(id: string, message?: string): void {
  getStatusEl(id).textContent = message ?? "\u00A0";
}

async function typeText(
  element: HTMLElement,
  text: string,
  shouldCancel: () => boolean,
): Promise<void> {
  const line = document.createElement("div");
  line.className = "mb-1 last:mb-0";
  line.textContent = "> ";
  element.appendChild(line);
  element.scrollTop = element.scrollHeight;

  for (const char of text) {
    if (shouldCancel()) return;
    line.textContent += char;
    element.scrollTop = element.scrollHeight;
    await wait(12);
  }
}

function renderAlgoSection(algo: Algorithm): string {
  const hasThinking = algo.id === "agentic";

  return `
    <section class="w-full max-w-md mx-auto" data-algo="${algo.id}">
      <h2 class="font-mono text-xl font-bold text-white lowercase tracking-tight text-center mb-1">${algo.name}</h2>
      <p class="text-center text-neutral-500 text-sm mb-3">${algo.tagline}</p>
      <div class="flex justify-center gap-2 mb-8">
        <span class="font-mono text-[11px] text-neutral-600 bg-neutral-800/60 px-2.5 py-1 rounded-md">time: ${algo.timeComplexity}</span>
        <span class="font-mono text-[11px] text-neutral-600 bg-neutral-800/60 px-2.5 py-1 rounded-md">space: ${algo.spaceComplexity}</span>
      </div>
      ${
        hasThinking
          ? `<div class="hidden font-mono text-[10px] leading-[1.6] text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-lg p-3 mb-6 max-h-[80px] overflow-y-auto" data-thinking="${algo.id}"></div>`
          : ""
      }
      <div class="flex items-end justify-center gap-1.5 h-[200px] mb-4" data-bars="${algo.id}"></div>
      <div class="font-mono text-[11px] text-neutral-600 text-center h-4 mb-8 truncate" data-status="${algo.id}">&nbsp;</div>
      <div class="flex justify-center gap-3">
        <button data-sort="${algo.id}" class="px-8 py-2.5 bg-white text-neutral-900 text-sm font-mono rounded-xl hover:bg-neutral-200 active:bg-neutral-300 transition-colors cursor-pointer">sort</button>
        <button data-shuffle="${algo.id}" class="px-6 py-2.5 border border-neutral-700 text-neutral-500 text-sm font-mono rounded-xl hover:text-white hover:border-neutral-500 transition-colors cursor-pointer">shuffle</button>
      </div>
    </section>
  `;
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="min-h-screen px-6 py-16">
    <header class="text-center mb-20">
      <h1 class="font-mono text-3xl font-bold text-white tracking-tighter">sorting</h1>
      <p class="text-neutral-600 text-sm mt-2 tracking-tight">a curated collection of perfectly legitimate sorting algorithms</p>
    </header>

    <div class="flex flex-col gap-28">
      ${algorithms.map(renderAlgoSection).join("")}
    </div>

    <footer class="text-center mt-28">
      <p class="font-mono text-[11px] text-neutral-800 tracking-tight">none of these should be used in production. probably.</p>
    </footer>
  </div>
`;

for (const algo of algorithms) {
  createBars(algo.id);
}

async function runSort(algoId: string): Promise<void> {
  const runId = (runIds[algoId] ?? 0) + 1;
  runIds[algoId] = runId;

  const algo = algorithms.find((a) => a.id === algoId)!;
  const array = [...cardArrays[algoId]];
  const shouldCancel = () => runIds[algoId] !== runId;

  const thinkingEl = getThinkingEl(algoId);
  if (thinkingEl) {
    thinkingEl.innerHTML = "";
    thinkingEl.classList.add("hidden");
  }

  const sortBtn = document.querySelector<HTMLButtonElement>(`[data-sort="${algoId}"]`)!;
  sortBtn.textContent = "sorting...";
  sortBtn.disabled = true;

  try {
    for await (const step of algo.sort(array)) {
      if (shouldCancel()) return;

      updateBars(algoId, step);
      if (step.message) updateStatus(algoId, step.message);

      if (step.thinking && thinkingEl) {
        thinkingEl.classList.remove("hidden");
        await typeText(thinkingEl, step.thinking, shouldCancel);
        if (shouldCancel()) return;
      }

      if (step.delay && step.delay > 0) {
        await wait(step.delay);
      }
    }
  } catch (err) {
    console.error(`Sort error (${algoId}):`, err);
  } finally {
    if (!shouldCancel()) {
      sortBtn.textContent = "sort";
      sortBtn.disabled = false;
    }
  }
}

function shuffle(algoId: string): void {
  runIds[algoId] = (runIds[algoId] ?? 0) + 1;

  cardArrays[algoId] = shuffleArray(BAR_COUNT);
  createBars(algoId);
  updateStatus(algoId);

  const thinkingEl = getThinkingEl(algoId);
  if (thinkingEl) {
    thinkingEl.innerHTML = "";
    thinkingEl.classList.add("hidden");
  }

  const sortBtn = document.querySelector<HTMLButtonElement>(`[data-sort="${algoId}"]`)!;
  sortBtn.textContent = "sort";
  sortBtn.disabled = false;
}

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  const sortId = target.dataset.sort;
  if (sortId) {
    void runSort(sortId);
    return;
  }

  const shuffleId = target.dataset.shuffle;
  if (shuffleId) {
    shuffle(shuffleId);
  }
});
