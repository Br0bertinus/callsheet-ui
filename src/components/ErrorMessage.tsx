type ErrorMessageProps = {
  message: string;
};

// Consistent error display used across the entire app.
// Every query and mutation error should route through this component.
export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
