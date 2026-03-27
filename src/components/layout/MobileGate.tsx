export function MobileGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="hidden md:contents">{children}</div>
      <div className="flex md:hidden items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-900 p-8">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">&#128187;</div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">
            Desktop Only
          </h1>
          <p className="text-stone-500 dark:text-stone-400">
            Resume Builder is designed for desktop screens. Please open this app
            on a device with a screen width of at least 768px.
          </p>
        </div>
      </div>
    </>
  );
}
