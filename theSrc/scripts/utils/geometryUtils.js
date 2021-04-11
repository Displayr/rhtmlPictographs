module.exports = {
  // NB alg from http://stackoverflow.com/a/6565988/3344695
  computeImageDimensions (imageAspectRatio, containerWidth, containerHeight) {
    const containerAspectRatio = containerWidth / containerHeight
    const results = {}
    if (containerAspectRatio > imageAspectRatio) {
      results.width = imageAspectRatio * containerHeight
      results.height = containerHeight
    } else {
      results.width = containerWidth
      results.height = containerWidth / imageAspectRatio
    }

    results.x = (containerWidth - results.width) / 2
    results.y = (containerHeight - results.height) / 2
    results.aspectRatio = imageAspectRatio

    return results
  },
}
