<script>
    import Window from '../../../lib/components/xp/Window.svelte';
    import { runningPrograms, runHistory } from '../../../lib/store';
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
        title: 'Run',
        width: 400,
        height: 150,
        icon: '/images/xp/icons/Run.png',
        id,
        exec_path,
        resizable: false
    };

    let command = '';

    function run(){
        fs.run_command(command);
        runHistory.update(h => [command, ...h.filter(c => c !== command)].slice(0,10));
        destroy();
    }

    function on_key(e){
        if(e.key === 'Enter') run();
    }
</script>

<Window bind:this={window} on_click_close={destroy} options={options}>
    <div slot="content" class="p-4 text-sm space-y-2">
        <p>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</p>
        <input bind:value={command} class="border w-full p-1" on:keydown={on_key} autofocus />
        <div class="flex justify-end space-x-2 mt-2">
            <button class="px-4 py-1 border" on:click={run}>OK</button>
            <button class="px-4 py-1 border" on:click={destroy}>Cancel</button>
        </div>
    </div>
</Window>

