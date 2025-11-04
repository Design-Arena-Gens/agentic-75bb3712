import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Learn Anything Fast',
  description: 'A practical, interactive guide and planner to learn any skill quickly and effectively.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          {children}
        </div>
        <footer className="footer">
          <span>Built for focused, fast learning.</span>
        </footer>
      </body>
    </html>
  );
}
