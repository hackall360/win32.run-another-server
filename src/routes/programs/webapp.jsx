export default function WebApp(props) {
  const url = props?.fs_item?.url ?? "";
  return (
    <div class="w-full h-full">
      <iframe src={url} class="w-full h-full border-0" title="Web App" />
    </div>
  );
}
