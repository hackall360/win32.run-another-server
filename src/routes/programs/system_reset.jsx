import { resetSystem } from "../../lib/store";

export default function SystemReset() {
  const reset = async () => {
    if (confirm("This will erase all data and restore Windows XP to a fresh install. Continue?")) {
      await resetSystem();
      location.reload();
    }
  };

  return (
    <div class="p-4 text-sm">
      <p>Resetting will remove all user files and settings.</p>
      <button class="mt-4 px-3 py-1 bg-blue-600 text-white rounded" onClick={reset}>
        Reset System
      </button>
    </div>
  );
}
