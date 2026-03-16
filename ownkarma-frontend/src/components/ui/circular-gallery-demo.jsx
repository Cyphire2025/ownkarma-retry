import React from 'react'
import { CircularGallery } from './circular-gallery'

const galleryData = [
    {
        common: 'Lion',
        binomial: 'Panthera leo',
        photo: {
            url: 'https://images.unsplash.com/photo-1583499871880-de841d1ace2a?w=900&auto=format&fit=crop&q=80',
            text: 'lion couple kissing on a brown rock',
            pos: '47% 35%',
            by: 'Clement Roy',
        },
    },
    {
        common: 'Asiatic elephant',
        binomial: 'Elephas maximus',
        photo: {
            url: 'https://images.unsplash.com/photo-1571406761758-9a3eed5338ef?w=900&auto=format&fit=crop&q=80',
            text: 'herd of Sri Lankan elephants walking away from a river',
            pos: '75% 65%',
            by: 'Alex Azabache',
        },
    },
    {
        common: 'Red-tailed black cockatoo',
        binomial: 'Calyptorhynchus banksii',
        photo: {
            url: 'https://images.unsplash.com/photo-1619664208054-41eefeab29e9?w=900&auto=format&fit=crop&q=80',
            text: 'close-up of a black cockatoo',
            pos: '53% 43%',
            by: 'David Clode',
        },
    },
    {
        common: 'Dromedary',
        binomial: 'Camelus dromedarius',
        photo: {
            url: 'https://images.unsplash.com/photo-1662841238473-f4b137e123cb?w=900&auto=format&fit=crop&q=80',
            text: 'camel and her calf in the Sahara desert',
            pos: '65% 65%',
            by: 'Moaz Tobok',
        },
    },
]

function CircularGalleryDemo() {
    return (
        <div className="w-full" style={{ height: '500vh' }}>
            <div className="w-full" style={{ height: '100vh', position: 'sticky', top: 0, overflow: 'hidden' }}>
                <CircularGallery items={galleryData} />
            </div>
        </div>
    )
}

export default CircularGalleryDemo
