import { queueProgram } from '../../../store';

export let make = ({type, originator}) => {
    return {
        required_width: 200,
        required_height: 27 + 20,
        menu: [
            [
                {
                    name: 'Safely Remove Hardware',
                    font: 'bold',
                    action: () => {
                        queueProgram.set({
                            name: 'Safely Remove Hardware',
                            icon: '/images/xp/icons/SafelyRemoveHardware.png',
                            path: './programs/safely_remove_hardware.svelte'
                        })
                    }
                }
            ]
        ]
    }
}
