export default function ProgressBar(props) {
  const value = () => props.value ?? 0;
  const total = () => props.total ?? 100;
  const widthPercent = () => (total() === 0 ? 0 : (100 * value()) / total());

  return (
    <div
      class="bg-slate-100 border border-slate-500 rounded-sm w-10 h-1 p-0.5 overflow-hidden"
      style={props.style}
    >
      <div
        class="h-full bg-[url(/images/xp/battery_cell.png)] bg-contain bg-repeat-x"
        style={{ width: `${widthPercent()}%` }}
      />
    </div>
  );
}
