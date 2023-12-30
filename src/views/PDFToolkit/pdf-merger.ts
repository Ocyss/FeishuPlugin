// https://github.com/nbesli/pdf-merger-js/tree/v3.4.0

import pdf from 'pdfjs'

type inputFile = string | ArrayBuffer | Blob | File

export class PDFMerger {
  doc: pdf.Document
  constructor(pdfjsOptions = { font: '' }) {
    this.doc = new pdf.Document(pdfjsOptions)
  }

  async add(inputFile: inputFile, pages?: string | string[] | undefined | null) {
    if (typeof pages === 'undefined' || pages === null) {
      return this._addEntireDocument(inputFile)
    }
    else if (Array.isArray(pages)) {
      return this._addGivenPages(inputFile, pages)
    }
    else if (pages.indexOf(',') > 0) {
      return this._addGivenPages(inputFile, pages.replace(/ /g, '').split(','))
    }
    else if (pages.toLowerCase().includes('to')) {
      const span = pages.replace(/ /g, '').split('to')
      return this._addFromToPage(
        inputFile,
        Number.parseInt(span[0]),
        Number.parseInt(span[1]),
      )
    }
    else if (pages.includes('-')) {
      const span = pages.replace(/ /g, '').split('-')
      return this._addFromToPage(
        inputFile,
        Number.parseInt(span[0]),
        Number.parseInt(span[1]),
      )
    }
    else {
      return this._addGivenPages(inputFile, [pages])
      // console.error('invalid parameter "pages"')
    }
  }

  _resetDoc(pdfjsOptions = { font: '' }) {
    this.doc = new pdf.Document(pdfjsOptions)
  }

  async _getInputFile(inputFile: inputFile) {
    if (inputFile instanceof ArrayBuffer)
      return inputFile

    if (typeof inputFile === 'string') {
      const res = await window.fetch(inputFile)
      const ab = await res.arrayBuffer()
      return ab
    }
    if (inputFile instanceof window.File) {
      const fileReader = new window.FileReader()

      fileReader.onload = function () {
        return fileReader.result
      }

      fileReader.readAsArrayBuffer(inputFile)
    }

    if (inputFile instanceof window.Blob)
      return await inputFile.arrayBuffer()

    throw new Error('pdf must be represented as an ArrayBuffer, Blob, Buffer, File, or URL')
  }

  async _addEntireDocument(inputFile: inputFile) {
    const src = await this._getInputFile(inputFile)
    const ext = new pdf.ExternalDocument(src)

    return this.doc.addPagesOf(ext)
  }

  async _addFromToPage(inputFile: inputFile, from: number, to: number) {
    if (
      typeof from === 'number'
        && typeof to === 'number'
        && from > 0
        && to > from
    ) {
      const pages = []

      for (let i = from; i <= to; i++)
        pages.push(i)

      const src = await this._getInputFile(inputFile)
      const ext = new pdf.ExternalDocument(src)
      this.doc.setTemplate(ext)

      return Promise.all(
        pages.map(async (page) => {
          try {
            this.doc.addPageOf(page, ext)
          }
          catch (e) {

          }
        }),
      )
    }
    else {
      console.log('invalid function parameter')
    }
  }

  async _addGivenPages(inputFile: inputFile, pages: string[]) {
    if (pages.length > 0) {
      const src = await this._getInputFile(inputFile)
      const ext = new pdf.ExternalDocument(src)
      this.doc.setTemplate(ext)

      return Promise.all(
        pages.map(async (_page) => {
          const page = Number(_page)
          try {
            this.doc.addPageOf(page, ext)
          }
          catch (e) {

          }
        }),
      )
    }
  }

  async saveAsBuffer(): Promise<ArrayBuffer> {
    return this.doc.asBuffer()
  }

  async saveAsBlob(): Promise<Blob> {
    const buffer = await this.saveAsBuffer()

    return new window.Blob([buffer], {
      type: 'application/pdf',
    })
  }

  async save(fileName: string) {
    const blob = await this.saveAsBlob()

    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `${fileName}.pdf`
    link.click()
  }
}
