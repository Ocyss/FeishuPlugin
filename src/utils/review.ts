export class Timer {
  label: string
  time: number
  constructor(label?: string) {
    this.time = performance.now()
    this.label = label ?? 'Timer Init'
  }

  t(label?: string) {
    console.log(`${this.label}: ${performance.now() - this.time}`)
    this.label = label ?? ''
    this.time = performance.now()
  }
}
