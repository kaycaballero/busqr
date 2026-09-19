export function getCurrentPosition(): Promise<{ lat: number | null; lon: number | null }> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({ lat: null, lon: null })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: null, lon: null }),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    )
  })
}
