export function base64ToBlob(base64: string): Blob {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--)
    u8arr[n] = bstr.charCodeAt(n)

  return new Blob([u8arr], {
    type: mime,
  })
}

export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName)
}

export function fileToBlob(file: File): Blob {
  return new Blob([file], { type: file.type })
}

export function fileToBuf(fd: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      if (!reader.result || typeof reader.result === 'string')
        reject(new Error('Invalid'))
      else
        resolve(reader.result)
    }
    reader.readAsArrayBuffer(fd)
  })
}
