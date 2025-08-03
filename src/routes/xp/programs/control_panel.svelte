<script>
    import Window from '../../../lib/components/xp/Window.svelte';
    import { runningPrograms, queueProgram } from '../../../lib/store';

    export let id;
    export let window;
    export let self;
    export let exec_path;

    export function destroy(){
        runningPrograms.update(programs => programs.filter(p => p != self));
        self.$destroy();
    }

    export let options = {
        title: 'Control Panel',
        width: 600,
        height: 400,
        icon: '/images/xp/icons/ControlPanel.png',
        id,
        exec_path
    };

    let items = [
        {name:'Display', icon:'/images/xp/icons/DisplayProperties.png', path:'./programs/display_properties.svelte'},
        {name:'Add or Remove Programs', icon:'/images/xp/icons/Programs.png', path:'./programs/app_installer.svelte'},
        {name:'Volume', icon:'/images/xp/icons/Volume.png', path:'./programs/volume_adjust.svelte'}
    ];

    function open(item){
        queueProgram.set({path:item.path, ...(item.fs_item?{fs_item:item.fs_item}:{})});
    }
</script>

<Window bind:this={window} on_click_close={destroy} options={options}>
    <div slot="content" class="p-4 grid grid-cols-3 gap-4 text-center select-none">
        {#each items as item}
            <div class="flex flex-col items-center cursor-pointer" on:dblclick={() => open(item)}>
                <img src={item.icon} class="w-12 h-12 mb-2" alt={item.name} />
                <span class="text-xs">{item.name}</span>
            </div>
        {/each}
    </div>
</Window>

