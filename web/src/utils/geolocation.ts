import { MemoLocation } from "@/types/proto/api/v2/memo_service";

// Resolve location from latitude and longitude
const API_KEY = '14020f155b2e4dadb260e850f195e2a3';
const resolveLocation = async (lat: number, lon: number): Promise<string | undefined> => {
    if (!lat || !lon) return undefined;

    const urlParams = new URLSearchParams({ lat: lat.toString(), lon: lon.toString(), apiKey: API_KEY });
    const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?${urlParams}`);
    const data = await response.json();
    const city = data.features[0].properties.city;
    const state = data.features[0].properties.state;
    // const country = data.features[0].properties.country;
    return `${city}, ${state}`;
}
export { resolveLocation };