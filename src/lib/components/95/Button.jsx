export default function Button(props) {
  const handleClick = (e) => props.on_click && props.on_click(e);

  return (
    <button
      onClick={handleClick}
      disabled={props.disabled}
      style={`${props.style || ''};background: silver;box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px grey, inset 2px 2px #dfdfdf;`}
      class="px-2 py-1 text-center min-w-[50px] min-h-[20px] font-MSSS text-sm text-black focus:outline-dotted outline-black outline-offset-[-4px] disabled:text-gray-500"
    >
      {props.title}
      {props.children}
    </button>
  );
}
