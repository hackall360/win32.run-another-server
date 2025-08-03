<svelte:options accessors={true} />
<script>
    import Window from "../../../lib/components/xp/Window.svelte";
    import { runningPrograms } from "../../../lib/store";

    export let id;
    export let window;
    export let self;
    export let parentNode;
    export let exec_path;

    export function destroy(){
        runningPrograms.update(programs => programs.filter(p => p !== self));
        self.$destroy();
    }

    export let options = {
        title: 'Network Connections',
        width: 300,
        height: 200,
        icon: '/images/xp/icons/ConnectionStatus.png',
        id,
        exec_path,
    };
</script>

<Window bind:this={window} on_click_close={destroy} {options}>
    <div slot="content" class="p-4 text-sm">
        Network status details are not implemented.
    </div>
</Window>
