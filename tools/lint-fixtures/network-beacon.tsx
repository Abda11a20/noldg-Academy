export function NetworkBeaconViolation() {
  return navigator.sendBeacon("/api/beacon");
}
