// Shared by overlapping entry and route loaders; never alter page content.
const holders = new Set<symbol>()
export const loadingMotionPaused = () => holders.size > 0
export function holdLoadingMotion() {
  const token = Symbol()
  holders.add(token)
  dispatchEvent(new Event('portfolio-loading-motion'))
  return () => { holders.delete(token); dispatchEvent(new Event('portfolio-loading-motion')) }
}
