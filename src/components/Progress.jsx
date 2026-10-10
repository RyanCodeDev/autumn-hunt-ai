export default function Progress({ text, percentage }) {
  percentage = percentage ?? 0;
  return (
    <div className="progress-container relative text-xs text-white bg-gray-200 border border-gray-300 rounded-lg text-left overflow-hidden">
      <div
        className="progress-bar px-1 top-0 z-0 w-[1%] overflow-hidden bg-blue-600 whitespace-nowrap"
        style={{ width: `${percentage}%` }}
      >
        {text} ({`${percentage.toFixed(2)}%`})
      </div>
    </div>
  );
}