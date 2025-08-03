<script>
    import { onMount, onDestroy } from 'svelte';
    import { queueProgram, systemVolume, contextMenu } from '../../lib/store';
    import TrayIcon from '../../lib/components/xp/TrayIcon.svelte';

    let time = get_time();

    let interval = setInterval(() => {
        time = get_time();
    }, 1000);

    onDestroy(() => {
        clearInterval(interval);
    })

    function get_time(){
        return (new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    }

    async function open_volume_adjust(e){
        console.log(e);
        const Program = (await import('./programs/volume_adjust.svelte')).default;
        let program = new Program({
            target: document.body,
            props:{position: {bottom: e.pageY-20, left: e.pageX}}
        });
        program.self = program;
    }

    function open_network_status(){
        queueProgram.set({
            name: 'Network Connections',
            icon: '/images/xp/icons/ConnectionStatus.png',
            path: './programs/network_status.svelte'
        });
    }

    function open_safely_remove(){
        queueProgram.set({
            name: 'Safely Remove Hardware',
            icon: '/images/xp/icons/SafelyRemoveHardware.png',
            path: './programs/safely_remove_hardware.svelte'
        });
    }

    function open_windows_update(){
        queueProgram.set({
            name: 'Windows Update',
            icon: '/images/xp/icons/WindowsUpdate.png',
            path: './programs/windows_update.svelte'
        });
    }

    function show_context_menu(type, ev){
        contextMenu.set(null);
        contextMenu.set({x: ev.x, y: ev.y, type, originator: {}});
    }

</script>

<style>
    .system-tray {
        background: linear-gradient(rgb(12, 89, 185) 1%, rgb(19, 158, 233) 6%, rgb(24, 181, 242) 10%, rgb(19, 155, 235) 14%, rgb(18, 144, 232) 19%, rgb(13, 141, 234) 63%, rgb(13, 159, 241) 81%, rgb(15, 158, 237) 88%, rgb(17, 155, 233) 91%, rgb(19, 146, 226) 94%, rgb(19, 126, 215) 97%, rgb(9, 91, 201) 100%);
        border-left: 1px solid rgb(16, 66, 175);
        box-shadow: rgb(24 187 255) 1px 0px 1px inset;
        padding: 0px 10px;
        margin-left: 10px;
    }
</style>

<div class="system-tray shrink-0  max-w-[200px] h-full flex flex-row items-center justify-end">
    
    <TrayIcon icon="/images/xp/icons/TourXP.png" tooltip_message="Take a tour of Windows XP"
            on_click={() => {
                console.log('tray icon click')
                queueProgram.set({
                    name: 'Microsoft Windows XP Tour',
                    icon: '/images/xp/icons/TourXP.png',
                    path: './programs/xp_tour.svelte'
                })
            }}></TrayIcon>
    <TrayIcon icon="/images/xp/icons/ConnectionStatus.png" tooltip_message="Local Area Connection"
            on_click={open_network_status}
            on_contextmenu={(ev) => show_context_menu('TrayNetwork', ev)}></TrayIcon>
    <TrayIcon icon="/images/xp/icons/SafelyRemoveHardware.png" tooltip_message="Safely Remove Hardware"
            on_click={open_safely_remove}
            on_contextmenu={(ev) => show_context_menu('TraySafelyRemove', ev)}></TrayIcon>
    <TrayIcon icon="/images/xp/icons/WindowsUpdate.png" tooltip_message="Automatic Updates"
            on_click={open_windows_update}
            on_contextmenu={(ev) => show_context_menu('TrayWindowsUpdate', ev)}></TrayIcon>
    <TrayIcon icon="/images/xp/icons/SecurityError.png"></TrayIcon>
    <TrayIcon icon="{$systemVolume > 0.03 ? '/images/xp/icons/Volume.png' : '/images/xp/icons/Mute.png'}" tooltip_message="Adjust volume" on_click={open_volume_adjust}></TrayIcon>
    <span class="text-slate-50 text-[11px] px-1">{time}</span>
</div>