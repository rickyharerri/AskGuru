import { DocuQueryClient } from '@/components/docu-query-client';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary font-headline">DocuQuery</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Your intelligent document assistant. Upload a PDF and get instant answers to your questions.
          </p>
        </header>
        <div className="w-full">
          <DocuQueryClient />
        </div>
      </div>
    </main>
  );
}
