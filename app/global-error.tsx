'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="container mx-auto px-4 py-20 mt-20 text-center">
          <h2 className="text-2xl font-orbitron font-semibold mb-6 text-text">
            Something went wrong!
          </h2>
          <button
            onClick={reset}
            className="px-8 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

