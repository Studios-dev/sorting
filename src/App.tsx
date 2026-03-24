import { algorithms } from "./algorithms.ts";
import AlgorithmCard from "./components/AlgorithmCard.tsx";

export default function App() {
  return (
    <div className="min-h-screen px-6 py-16">
      <header className="text-center mb-20">
        <h1 className="text-3xl font-bold text-white tracking-tighter">sorting</h1>
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
