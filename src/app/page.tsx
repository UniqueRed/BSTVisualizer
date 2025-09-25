import BSTVisualizer from "@/app/components/BSTVisualizer";

export default function Home() {
  return (
    <main className="container mx-auto p-4 transition-all duration-300">
      <BSTVisualizer />
      <section className="mt-6 p-4 text-center text-gray-600">
        <p className="text-lg">
          Created by <strong>Adhviklal Thoppe</strong>
        </p>
      </section>
    </main>
  );
}
