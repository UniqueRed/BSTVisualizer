import BSTVisualizer from "@/app/components/BSTVisualizer";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Binary Search Tree Visualizer</h1>
      <BSTVisualizer />
    </main>
  );
}
