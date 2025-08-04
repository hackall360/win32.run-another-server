import { hardDrive, setQueueProgram } from '../../../store';
import { recycle_bin_id } from '../../../system';
import * as fs from '../../../fs';
export let make = ({type, originator}) => {
    //originator: a wrapped fs item, i.e, file, folder, drive
    // {item: item, open: fn(), my_computer_instance: obj}


    return {
        required_width: 180 + 20,
        required_height: 27*3 + 20,
        menu: [
            [
                {
                    name: 'Open',
                    action: () => {
                        let fs_item = hardDrive()[recycle_bin_id];
                        setQueueProgram({
                            path: './programs/my_computer.jsx',
                            fs_item: fs_item
                        });
                    },
                    font: 'bold',
                }
            ],
            [
                {
                    name: 'Empty Recycle Bin', 
                    action: () => {
                        let yes_action = () => {
                            let children = hardDrive()[recycle_bin_id].children;
                            for(let id of [...children]){
                                fs.del_fs(id);
                            }
                        }

                        confirm_delete({
                            node_ref: document.body,
                            title: 'Confirm Delete File',
                            icon: '/images/xp/icons/DeleteConfirmation.png' ,
                            message: 'Do you want to permanently delete all files in the Recycle Bin? This action cannot be undone.',
                            yes_action: yes_action,
                            no_action: () => {}
                        });
                    }
                },
                {
                    name: 'Properties',
                    action: () => {
                        // queueProgram.set({
                        //     path: './programs/properties.svelte',
                        //     fs_item: originator.item
                        // })
                    }
                }
            ]
        ]
    }
}


async function confirm_delete({node_ref, title, message, icon, yes_action, no_action}){
    const Dialog = (await import('../Dialog.svelte')).default;
        let buttons = [
            {
                name: 'OK',
                action: () => {
                    yes_action();
                    dialog.destroy();
                },
                focus: true
            },
            {
                name: 'Cancel',
                action: () => {
                    no_action();
                    dialog.destroy();
                }
            }
        ]
        let dialog = new Dialog({
            target: node_ref,
            props:{
                icon,
                title,
                message,
                buttons
            }
        })
        dialog.self = dialog;
}