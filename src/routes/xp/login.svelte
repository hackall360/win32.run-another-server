<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { get, set } from 'idb-keyval';
    import axios from 'axios';
    import { hardDrive, wallpaper, contextMenu, users, currentUser, loadUsers } from '../../lib/store';
    import { bliss_wallpaper, SortOptions, SortOrders } from '../../lib/system';

    let dispatcher = createEventDispatcher();
    let profiles = [];
    let selectedUser = null;
    let password = '';

    onMount(async () => {
        await loadUsers();
        users.subscribe(v => profiles = v);
        await load_hard_drive();
        await load_wallpaper();
        preload_iframes();
        preload_context_menus();
    });

    function selectUser(user){
        selectedUser = user;
        password = '';
    }

    function login(){
        if(selectedUser){
            if(selectedUser.password === '' || selectedUser.password === password){
                currentUser.set(selectedUser);
                dispatcher('load_page', {url: './xp/desktop.svelte'});
            } else {
                alert('Incorrect password');
            }
        }
    }

    async function load_hard_drive(){
        let hd = await get('hard_drive');
        if(hd == null){
            hd = (await axios({ method: 'get', url: '/json/hard_drive.json' })).data;
            await set('hard_drive', hd);
        }
        migrate_files_format(hd);
        hardDrive.set(hd);
    }

    function migrate_files_format(drive){
        let now = (new Date()).getTime();
        for(let key of Object.keys(drive)){
            let obj = drive[key];
            if(obj.children == null){
                obj.children = [...obj.files, ...obj.folders];
                delete obj.files;
                delete obj.folders;
            }
            if(obj.date_created == null){
                obj.date_created = now;
            }
            if(obj.date_modified == null){
                obj.date_modified = now;
            }
            if(obj.sort_option == null){
                obj.sort_option = SortOptions.NONE;
            }
            if(obj.sort_order == null){
                obj.sort_order = SortOrders.ASCENDING;
            }
        }
    }

    async function load_wallpaper(){
        let wp = await get('wallpaper');
        if(wp == null){
            wp = bliss_wallpaper;
            await set('wallpaper', bliss_wallpaper);
        }
        wallpaper.set(wp);
    }

    function preload_iframes(){
        let urls = [
            '/html/foxit_reader/web/viewer.html',
            '/html/jspaint/index.html',
            '/html/koodo/index.html',
            '/html/msword/index.html',
            '/html/photon/app/index.html',
            '/html/notepad/index.html'
        ];
        let parent = document.querySelector('#iframe-preload');
        for(let url of urls){
            let iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.inset = '0';
            iframe.src = url;
            iframe.onload = (e) => {
                e.target.remove();
            };
            parent.appendChild(iframe);
        }
    }

    function preload_context_menus(){
        let types = ['ProgramTile', 'Desktop', 'FSVoid', 'FSItem', 'RecycleBin'];
        for(let type of types){
            contextMenu.set({x: -1000, y: -1000, type, originator: {}});
        }
    }
</script>

<div class="absolute inset-0 z-50 overflow-hidden flex flex-col bg-[#5a7edc] font-sans">
    <div class="h-[70px] bg-[#00309c] flex flex-row items-center shrink-0"></div>
    <div class="h-[2px] bg-[linear-gradient(45deg,#466dcd,#c7ddff,#b0c9f7,#5a7edc)] shrink-0"></div>
    <div class="grow bg-[radial-gradient(circle_at_5%_5%,#91b1ef_0,#7698e6_6%,#5a7edc_12%)] relative overflow-hidden">
        <div class="flex flex-row justify-center mt-10 space-x-10">
            {#each profiles as user}
                <div class="flex flex-col items-center cursor-pointer" on:click={() => selectUser(user)}>
                    <img src={user.avatar} alt={user.name} class="w-24 h-24 border-2 border-white" />
                    <span class="mt-2 text-white font-bold">{user.name}</span>
                </div>
            {/each}
        </div>
        {#if selectedUser}
        <div class="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white p-4 rounded shadow">
            <div class="mb-2 text-sm">Password</div>
            <input type="password" bind:value={password} class="border p-1 w-48" on:keydown={(e)=>{if(e.key==='Enter') login();}} autofocus />
            <button class="ml-2 px-3 py-1 bg-blue-600 text-white rounded" on:click={login}>OK</button>
        </div>
        {/if}
        <div id="iframe-preload" style="position:absolute; inset:-1000px;"></div>
    </div>
    <div class="h-[2px] bg-[linear-gradient(45deg,#003399,#f99736,#c2814d,#00309c)] shrink-0"></div>
    <div class="h-[70px] w-full bg-[linear-gradient(90deg,#3833ac,#00309c)] shrink-0 relative"></div>
</div>

<svelte:options accessors={true}></svelte:options>
