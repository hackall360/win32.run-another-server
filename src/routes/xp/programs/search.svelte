<script>
    import Window from '../../../lib/components/xp/Window.svelte';
    import { runningPrograms, queueProgram } from '../../../lib/store';
    import * as fs from '../../../lib/fs';

    export let id;
    export let window;
    export let self;
    export let exec_path;

    export function destroy(){
        runningPrograms.update(programs => programs.filter(p => p != self));
        self.$destroy();
    }

    export let options = {
        title: 'Search',
        width: 500,
        height: 400,
        icon: '/images/xp/icons/Search.png',
        id,
        exec_path
    };

    let query = '';
    let results = [];

    function do_search(){
        results = fs.search_fs(query);
    }

    function open(item){
        if(item.type === 'file'){
            queueProgram.set({path:'./programs/notepad.svelte', fs_item:item});
        } else {
            queueProgram.set({path:'./programs/my_computer.svelte', fs_item:item});
        }
    }
</script>

<Window bind:this={window} on_click_close={destroy} options={options}>
    <div slot="content" class="p-4 text-sm h-full flex flex-col">
        <input bind:value={query} class="border p-1 mb-2" placeholder="Search" on:keydown={(e)=>e.key==='Enter' && do_search()} />
        <div class="overflow-auto flex-1">
            {#each results as item}
                <div class="flex items-center space-x-2 cursor-pointer hover:bg-blue-500 hover:text-white p-1" on:dblclick={() => open(item)}>
                    <img src={item.icon || (item.type==='file' ? '/images/xp/icons/TXT.png' : '/images/xp/icons/FolderClosed.png')} class="w-4 h-4" alt="" />
                    <span>{item.name}</span>
                </div>
            {/each}
            {#if results.length === 0}
                <p class="text-center text-gray-500">No results</p>
            {/if}
        </div>
    </div>
</Window>

