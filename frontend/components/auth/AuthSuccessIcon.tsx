/**
 * Checkmark-Icon für Auth-Erfolgsmeldungen (z.B. Passwort-Reset, E-Mail gesendet)
 */
export function AuthSuccessIcon() {
  return (
    <div className="mx-auto w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
      <svg
        className="w-6 h-6 text-success-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  );
}
