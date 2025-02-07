import BSTVisualizer from "@/app/components/BSTVisualizer";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Binary Search Tree Visualizer</h1>
      <BSTVisualizer />
      <section className="mt-6 p-4 text-center text-gray-600">
        <p className="text-lg">
          Created by <strong>Adhviklal Thoppe</strong>
        </p>
      </section>
    </main>
  );
}
