/**
 * Download a list of files.
 * @author speedplane
 */
function download_files(files: { download: string, filename: string }[]) {
  function download_next(i: number) {
    if (i >= files.length)
      return

    const a = document.createElement('a')
    a.href = files[i].download
    a.target = '_parent'
    // Use a.download if available, it prevents plugins from opening.
    if ('download' in a)
      a.download = files[i].filename;

    // Add a to the doc for click to work.
    (document.body || document.documentElement).appendChild(a)

    a.click() // The click method is supported by most browsers.

    // Delete the temporary link.
    a.remove()
    // Download the next file with a small timeout. The timeout is necessary
    // for IE, which will otherwise only download the first file.
    setTimeout(() => {
      download_next(i + 1)
    }, 500)
  }
  // Initiate the first download.
  download_next(0)
}

export function useDownload() {
  return {
    download_files,
  }
}
