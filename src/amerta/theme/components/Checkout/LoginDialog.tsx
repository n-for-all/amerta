import LoginForm from "../LoginForm";

export const LoginDialog = ({ onClose, logo }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <LoginForm
          logo={logo}
          innerClassName="flex flex-col items-center w-full max-w-sm min-w-sm gap-y-4"
          onLoginSuccess={() => {
            onClose();
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
};
