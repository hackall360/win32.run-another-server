export default function InternetExplorer(props) {
  const url = props?.fs_item?.url ?? "https://example.com";
  return (
    <div class="w-full h-full">
      <iframe src={url} class="w-full h-full border-0" title="Internet Explorer" />
    </div>
  );
}
