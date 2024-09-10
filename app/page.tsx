"use client"

import { useEffect, useRef, useState } from 'react';

import { Button, Layout, message, Row } from 'antd';
import mapboxgl, { GeoJSONFeature, MapboxGeoJSONFeature, MapMouseEvent } from 'mapbox-gl';
import { AimOutlined } from "@ant-design/icons";

const { Content } = Layout;

mapboxgl.accessToken = 'pk.eyJ1IjoieGNhZ2U3IiwiYSI6ImNsNGlrbTc0bTBmajgzY3BmNHA1NDVwMmYifQ.SrIHjoAhw8wWViQsLfjmUQ';

interface Location {
    lat: number;
    lng: number;
}

// Define types for the Geocoding API response
interface GeocodingFeature {
    place_name: string;
    geometry: {
        coordinates: [number, number][][];
    };
}

interface GeocodingResponse {
    features: GeocodingFeature[];
}

export default function Map() {

    const mapContainer = useRef(null);

    useEffect(() => {

        // init the map object
        const map = new mapboxgl.Map({
            container: mapContainer.current as any, // container ID
            style: 'mapbox://styles/mapbox/streets-v11', // style URL
            center: [38.76123, 9.01068], // starting position [lng, lat]
            zoom: 10, // starting zoom
            // projection: { name: "naturalEarth" } // display the map as a 3D globe
        });

        // Add geolocate control to the map.
        // map.addControl(
        //     new mapboxgl.GeolocateControl({
        //         positionOptions: {
        //             enableHighAccuracy: true,
        //         },
        //         showUserLocation: true,
        //         showAccuracyCircle: true,
        //         trackUserLocation: true,
        //         showUserHeading: true,
        //     })
        // );

        // Function to draw the polygon
        function drawPolygon(coordinates: [number, number][][]) {
            map.addSource('city-boundary', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': coordinates
                    },
                    'properties': {}  // Add an empty properties object
                }
            });

            map.addLayer({
                'id': 'city-boundary-layer',
                'type': 'fill',
                'source': 'city-boundary',
                'layout': {},
                'paint': {
                    'fill-color': '#088',
                    'fill-opacity': 0.4
                }
            });
        }

        const locations: Location[] = [
            { lng: 38.76, lat: 9.04, },
        ];

        // Function to get the user's current location
        function getCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const userLng = position.coords.longitude;
                    const userLat = position.coords.latitude;

                    // add marker to current position
                    const marker = new mapboxgl.Marker({ color: "blue", scale: 0.7 })
                        .setLngLat([userLng, userLat]);

                    marker.addTo(map);

                    // Optionally, center the map on the user's location
                    map.flyTo({
                        center: [userLng, userLat],
                        zoom: 12
                    });

                    // Get features at the user's location
                    getFeaturesAtLocation(userLng, userLat);
                }, (error) => {
                    console.error('Error getting location:', error);
                });
            } else {
                console.error('Geolocation is not supported by this browser.');
            }
        }

        // Function to query rendered features based on the user's location
        function getFeaturesAtLocation(lng: number, lat: number) {
            // Convert the user's location to a point on the screen (map)
            const point = map.project([lng, lat]);

            // Query the rendered features near the user's location
            const features: GeoJSONFeature[] = map.queryRenderedFeatures(point, {
                layers: ["settlement-label", "settlement-subdivision-label", "poi-label", "airport-label"]  // Specify the layer containing the labels (e.g., city names)
            });

            if (features.length > 0) {
                features.forEach((feature) => {
                    const placeName = feature.properties?.name;
                    const layerId = feature.layer?.id;
                    message.info(`You are around ${placeName}`);

                    // console.log(`Feature: ${placeName} from layer: ${layerId}`);
                });
            } else {
                message.warning("Nothing found at your current location");
                // console.log('No features found at this location.');
            }
        }

        // Trigger the function to get current location and query features
        map.on('load', () => {
            getCurrentLocation();  // Get features based on current location when the map loads
        });

        // Function to update cursor style based on features
        function updateCursorStyle(e: mapboxgl.MapMouseEvent) {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["settlement-label", "settlement-subdivision-label", "poi-label", "airport-label"]  // Specify the layer containing the labels (e.g., city names)
            });

            if (features.length > 0) {
                // If features are found, set cursor to pointer
                map.getCanvas().style.cursor = 'pointer';
            } else {
                // If no features are found, reset cursor to default
                map.getCanvas().style.cursor = '';
            }
        }

        // Add event listener to update cursor style
        map.on('mousemove', updateCursorStyle);

        // Get and log all layers in the current style
        // map.on('load', () => {
        //     const layers = map.getStyle()?.layers;
        //     if (layers) {
        //         // console.log("place-label: ", layers.includes("place-label" as any));
        //         // console.log("settlement-label: ", layers.includes("settlement-label" as any));
        //         // console.log("state-label: ", layers.includes("state-label" as any));

        //         console.log("layers: ", layers);

        //         // layers.forEach(layer => console.log(layer.id));
        //     }
        // });

        // add predefined markers when the map is loaded
        // map.on("load", () => {
        //     // add predefined markers to map
        //     locations.forEach((location) => {

        //         const marker = new mapboxgl.Marker({ color: "green", scale: 0.7 })
        //             .setLngLat([location.lng, location.lat]);

        //         marker.addTo(map);
        //     });
        // });

        // add markers when you click on the map
        // map.on("click", async (e) => {
        //     const { lng, lat } = e.lngLat;

        //     const marker = new mapboxgl.Marker({ color: "red", scale: 0.7 })
        //         .setLngLat([lng, lat]);

        //     marker.addTo(map);

        //     message.info(`lng: ${e.lngLat.lng.toFixed(2)}, lat: ${e.lngLat.lat.toFixed(2)}`);
        // });

        // get information and draw a polygon when you click on the map
        // map.on("click", async (e) => {
        //     const { lng, lat } = e.lngLat;

        //     try {
        //         const response = await fetch(
        //             `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place&access_token=${mapboxgl.accessToken}`
        //         );
        //         const data: GeocodingResponse = await response.json();

        //         console.log("data: ", data);

        //         if (data.features.length > 0) {
        //             const city: GeocodingFeature = data.features[0];
        //             const coordinates: [number, number][][] = city.geometry.coordinates;

        //             // Draw polygon for the city boundary
        //             drawPolygon(coordinates);
        //         }
        //     } catch (error) {
        //         console.error('Error fetching city data:', error);
        //     }
        // });

        // Handle map click event to query rendered features
        map.on('click', (e: MapMouseEvent) => {
            // Query the rendered features at the clicked point (labels, etc.)
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["settlement-label", "settlement-subdivision-label", "poi-label", "airport-label"]  // Specify the layer containing the labels (e.g., city names)
            });

            if (features.length > 0) {
                // Get the first feature (label) that was clicked
                const clickedFeature = features[0];

                // Display or use the properties of the feature
                const placeName = clickedFeature.properties?.name; // City or place name
                // console.log(`Clicked place: ${placeName}`);
                message.info(`Clicked place: ${placeName}`);

                // You can also use additional properties from the feature
                // const otherProperty = clickedFeature.properties?.your_property_name;
            } else {
                // console.log('No label or feature found at this location.');
                message.warning('No label or feature found at this location.');
            }
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

