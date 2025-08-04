<script>
    import { tooltip, setTooltip } from './tooltip';
    export let style = '';
    export let tooltip_message;
    export let icon;

    export let on_click = () =>  {
        console.log('on click')
    }

    export let on_contextmenu = (e) => {
        // optional right click handler
    }

    function on_mouseenter(e){
        if(tooltip_message == null) return;
        let position = {left: e.x, top: e.y - 40};
        if(tooltip_message.length >= 20){
            position.top = position.top - 20;
        }
        setTooltip({message: tooltip_message, position});
    }

    function on_mouseleave(e){
        setTooltip(null);
    }


</script>

<div class="mr-1 w-4 h-4 bg-no-repeat bg-contain" style:background-image="url({icon})"
    on:click={on_click}
    on:contextmenu={on_contextmenu}
    use:tooltip tooltip="{tooltip_message}">
</div>