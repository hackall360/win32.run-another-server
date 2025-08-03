import { queueProgram } from '../../../store';

export let make = ({type, originator}) => {
    return {
        required_width: 200,
        required_height: 27 + 20,
        menu: [
            [
                {
                    name: 'Open Network Connections',
                    font: 'bold',
                    action: () => {
                        queueProgram.set({
                            name: 'Network Connections',
                            icon: '/images/xp/icons/ConnectionStatus.png',
                            path: './programs/network_status.svelte'
                        })
                    }
                }
            ]
        ]
    }
}
