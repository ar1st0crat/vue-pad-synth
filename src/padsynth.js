import Fft from './fft'

const BW = 20
const BW_SCALE = 1.25

class PadSynth {
  constructor (samplingRate, duration) {
    let x = samplingRate * duration
    this.fftSize = Math.ceil(2 ** Math.floor(Math.log(x) / Math.log(2)))
    this.fft = new Fft(this.fftSize)
    this.sr = samplingRate
    this.resolution = this.sr / this.fftSize
    this.bw = BW
    this.bwScale = BW_SCALE
  }

  spectrum (chord, amps) {
    function profile (fi, bwi) {
      let x = fi / bwi
      return Math.exp(-x * x) / bwi
    }

    let N = this.fftSize / 2
    let re = Array(this.fftSize).fill(0)

    chord.forEach(note => {
      let f = note.frequency
      for (let i = 1; i <= amps.length; i++) {
        if (amps[i - 1] === 0) continue
        let bwHz = (2 ** (this.bw / 1200) - 1.0) * f * (i ** this.bwScale)
        let fi = f * i / this.sr
        let bwi = bwHz / (2.0 * this.sr)

        let s = Math.floor(fi * N)
        if (s >= N) continue
        let h = 1
        let j = s
        while (h > 1e-10) {
          h = profile(1.0 * j / N - fi, bwi)
          re[j--] += h * amps[i - 1]
        }
        h = 1
        j = s + 1
        while (h > 1e-10) {
          h = profile(1.0 * j / N - fi, bwi)
          re[j++] += h * amps[i - 1]
        }
      }
    })
    return re
  }

  synthesize (spectrum) {
    let re = spectrum
    let im = Array(this.fftSize).fill(0)

    for (let i = 0; i < re.length; i++) {
      let mag = re[i]
      let phase = Math.random() * 2 * Math.PI
      re[i] = mag * Math.cos(phase)
      im[i] = mag * Math.sin(phase)
    }

    this.fft.inverse(re, im)

    let norm = 1.0 / Math.max.apply(Math, re)

    for (let i = 0; i < re.length; i++) {
      re[i] *= norm
    }

    return re
  }
}

export default PadSynth
