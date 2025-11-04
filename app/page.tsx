import Tips from '../components/Tips';
import PlanGenerator from '../components/PlanGenerator';

export default function Page() {
  return (
    <main>
      <section className="hero">
        <h1>Learn Anything Fast</h1>
        <p>Use proven methods, then get a personalized plan in seconds.</p>
      </section>

      <section className="content">
        <Tips />
      </section>

      <section className="tool">
        <PlanGenerator />
      </section>
    </main>
  );
}
