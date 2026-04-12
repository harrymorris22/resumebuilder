import { useState } from 'react';
import { migrateIdbToFirestore, type MigrationResult } from '../../utils/migration';

interface MigrationModalProps {
  uid: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function MigrationModal({ uid, onComplete, onSkip }: MigrationModalProps) {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);
    try {
      const res = await migrateIdbToFirestore(uid);
      setResult(res);
    } catch {
      setError('Migration failed. Your local data is still safe. Try again or skip for now.');
      setMigrating(false);
    }
  };

  const total = result
    ? result.resumes + result.contentPool + result.chatSessions + result.jobDescriptions + result.recommendations + result.coverLetters
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {!result ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-stone-900">
                  Upload local data?
                </h3>
                <p className="text-sm text-stone-500">
                  We found resumes and content saved in this browser.
                </p>
              </div>
            </div>

            <p className="text-sm text-stone-600 mb-6">
              Would you like to upload your local data to your cloud account?
              This makes it accessible from any device. Your local copy stays untouched.
            </p>

            {error && (
              <p className="text-sm text-rose-600 mb-4 bg-rose-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onSkip}
                disabled={migrating}
                className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {migrating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload to cloud'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-stone-900">
                  Migration complete
                </h3>
                <p className="text-sm text-stone-500">
                  {total} item{total !== 1 ? 's' : ''} uploaded to your cloud account.
                </p>
              </div>
            </div>

            <div className="text-sm text-stone-600 space-y-1 mb-6 bg-stone-50 rounded-lg px-4 py-3">
              {result.resumes > 0 && <p>{result.resumes} resume{result.resumes !== 1 ? 's' : ''}</p>}
              {result.contentPool > 0 && <p>{result.contentPool} content pool {result.contentPool !== 1 ? 'entries' : 'entry'}</p>}
              {result.chatSessions > 0 && <p>{result.chatSessions} chat session{result.chatSessions !== 1 ? 's' : ''}</p>}
              {result.jobDescriptions > 0 && <p>{result.jobDescriptions} job description{result.jobDescriptions !== 1 ? 's' : ''}</p>}
              {result.coverLetters > 0 && <p>{result.coverLetters} cover letter{result.coverLetters !== 1 ? 's' : ''}</p>}
              {result.recommendations > 0 && <p>{result.recommendations} recommendation{result.recommendations !== 1 ? 's' : ''}</p>}
            </div>

            <div className="flex justify-end">
              <button
                onClick={onComplete}
                className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors shadow-sm"
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
