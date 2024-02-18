// Resolve location from latitude and longitude
const resolveLocation = async (lat: number, lon: number): Promise<string | undefined> => {
  if (!lat || !lon) return undefined;

  const urlParams = new URLSearchParams({ format: "jsonv2", lat: lat.toString(), lon: lon.toString() });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${urlParams.toString()}`);
  const data = await response.json();
  const city = data.address.city;
  const state = data.address.state;
  // const country = data.features[0].properties.country;
  return `${city ? city + ", " : ""}${state}`;
};

export { resolveLocation };
