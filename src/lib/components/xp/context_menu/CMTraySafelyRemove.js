import { setQueueProgram } from '../../../store';

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
                        setQueueProgram({
                            name: 'Safely Remove Hardware',
                            icon: '/images/xp/icons/SafelyRemoveHardware.png',
                            path: './programs/safely_remove_hardware.jsx'
                        })
                    }
                }
            ]
        ]
    }
}
