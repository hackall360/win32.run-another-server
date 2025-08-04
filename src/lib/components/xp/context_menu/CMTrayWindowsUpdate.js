import { setQueueProgram } from '../../../store';

export let make = ({type, originator}) => {
    return {
        required_width: 200,
        required_height: 27 + 20,
        menu: [
            [
                {
                    name: 'Open Windows Update',
                    font: 'bold',
                    action: () => {
                        setQueueProgram({
                            name: 'Windows Update',
                            icon: '/images/xp/icons/WindowsUpdate.png',
                            path: './programs/windows_update.jsx'
                        })
                    }
                }
            ]
        ]
    }
}
