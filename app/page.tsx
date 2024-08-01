"use client"

import { useEffect, useRef, useState } from 'react';

import { Layout, message } from 'antd';
import mapboxgl from 'mapbox-gl';

const { Content } = Layout;

mapboxgl.accessToken = 'pk.eyJ1IjoieGNhZ2U3IiwiYSI6ImNsNGlrbTc0bTBmajgzY3BmNHA1NDVwMmYifQ.SrIHjoAhw8wWViQsLfjmUQ';

interface Location {
    lat: number;
    lng: number;
}

export default function Map() {

    const mapContainer = useRef(null);

    useEffect(() => {

        // init the map object
        const map = new mapboxgl.Map({
            container: mapContainer.current as any, // container ID
            style: 'mapbox://styles/mapbox/streets-v11', // style URL
            center: [38.76123, 9.01068], // starting position [lng, lat]
            zoom: 11, // starting zoom
            projection: { name: "globe" } // display the map as a 3D globe
        });

        const locations: Location[] = [
            { lng: 38.76, lat: 9.04, },
        ];

        map.on("load", () => {
            // add predefined markers to map
            locations.forEach((location) => {

                const marker = new mapboxgl.Marker({ color: "green", scale: 0.7 })
                    .setLngLat([location.lng, location.lat]);

                marker.addTo(map);
            });
        });

        // add markers when you click on the map
        map.on("click", (e) => {
            const marker = new mapboxgl.Marker({ color: "red", scale: 0.7 })
                .setLngLat([e.lngLat.lng, e.lngLat.lat]);

            marker.addTo(map);

            message.info(`lng: ${e.lngLat.lng.toFixed(2)}, lat: ${e.lngLat.lat.toFixed(2)}`);
        });

    }, []);

    return (
        <Layout>
            <Content
                style={{
                    padding: '0px',
                    margin: '0px',
                    background: '#fff',
                }}
                className='w-screen h-screen'
            >
                <div>
                    <div ref={mapContainer} className="w-screen h-screen" />
                </div>
            </Content>
        </Layout>
    );
}

