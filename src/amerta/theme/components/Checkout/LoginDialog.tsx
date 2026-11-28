import LoginForm from "@/amerta/theme/components/LoginForm";

export const LoginDialog = ({ onClose, logo }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-md max-h-full p-6 overflow-y-auto border rounded-lg shadow-lg bg-background text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800">
        <button type="button" onClick={onClose} className="absolute z-10 top-4 right-4 rtl:right-auto rtl:left-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <LoginForm
          logo={logo}
          innerClassName="flex flex-col items-center w-full max-w-sm min-w-[min(24rem,calc(100vw-5rem))] gap-y-4"
          onLoginSuccess={() => {
            onClose();
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
};
