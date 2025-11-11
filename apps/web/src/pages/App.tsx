import { Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="container py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Political Discourse Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Explore sentiment trends for topics across news articles.
        </p>
      </header>

      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">Try a Topic Report</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link className="btn" to="/report?term=climate">View “climate”</Link>
          <Link className="btn" to="/report?term=economy">View “economy”</Link>
        </div>
        <p className="text-sm text-gray-500">
          Tip: Once you implement ingestion, this will query real data you’ve stored.
        </p>
      </div>
    </div>
  );
}
