<template>
<div id="plots">
  <div id="spectrum"></div>
  <div>
    <p>Harmonics:</p>
    <input type="number" v-for="(amp, i) in amps" v-model.number="amps[i]" />
  </div>
  <div>
    <span>BW: </span>
    <input type="number" v-model="bw" />
    <span>BW scale: </span>
    <input type="number" v-model="bwScale" />
  </div>
</div>
</template>

<script>
import * as d3 from 'd3'
import PadSynth from '../padsynth'

const SAMPLING_RATE = 16000
const DURATION = 2

let synth = new PadSynth(SAMPLING_RATE, DURATION)

let audioContext = new AudioContext()
let audioBuffer = audioContext.createBuffer(1, synth.fftSize, SAMPLING_RATE)
let audioSource = audioContext.createBufferSource()
audioSource.buffer = audioBuffer
audioSource.connect(audioContext.destination)
audioSource.loop = true

let isPlaying = false

const WIDTH = 720
const HEIGHT = 100

let xScale = d3
  .scaleLinear()
  .domain([0, synth.fftSize / 2])
  .range([0, WIDTH - 3])

function createSpectrumPlot () {
  let yScale = d3
    .scaleLinear()
    .domain([-1, 1])
    .range([HEIGHT, 0])

  let line = d3
    .line()
    .x((d, i) => xScale(i))
    .y(d => yScale(d))

  let svg = d3
    .select('#plots #spectrum')
    .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT + 50)
    .append('g')
    .attr('transform', 'translate(3, 10)')

  svg.append('g')
    .attr('class', 'x axis')
    .attr('class', 'y axis')
    .attr('transform', 'translate(3,' + HEIGHT + ')')
    .call(d3.axisBottom(xScale))

  svg.append('path')
    .datum(Array(synth.fftSize).fill(0))
    .attr('class', 'line')
    .attr('d', line)
}

function updateSpectrumPlot (spectrum) {
  let max = Math.max.apply(Math, spectrum)
  let min = Math.min.apply(Math, spectrum)

  let yScale = d3
    .scaleLinear()
    .domain([min, max])
    .range([HEIGHT, 0])

  let line = d3
    .line()
    .x((d, i) => xScale(i))
    .y(d => yScale(d))

  let svg = d3.select('#spectrum svg').transition()
  svg.select('.line').attr('d', line(spectrum))
}

export default {
  data: () => ({
    chord: [],
    amps: [150, 110, 70, 40, 20, 12, 8, 3, 0, 3, 0, 2, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
    spectrum: [],
    bw: 20,
    bwScale: 1.25
  }),

  mounted () {
    this.update = createSpectrumPlot()
    this.$root.$on('noteChanged', chord => {
      this.chord = chord
      this.spectrum = synth.spectrum(this.chord, this.amps)
      updateSpectrumPlot(this.spectrum)
      this.play()
    })
  },

  watch: {
    amps: {
      handler: function () {
        this.resynthesize()
      },
      deep: true
    },
    bw: {
      handler: function (newBw) {
        if (newBw > 200) {
          newBw = 200
          this.bw = newBw
        }
        synth.bw = newBw
        this.resynthesize()
      }
    },
    bwScale: {
      handler: function (newBwScale) {
        if (newBwScale > 2) {
          newBwScale = 2
          this.bwScale = newBwScale
        }
        synth.bwScale = newBwScale
        this.resynthesize()
      }
    }
  },

  methods: {
    play: function () {
      let s = synth.synthesize(this.spectrum)

      audioBuffer.copyToChannel(new Float32Array(s), 0, 0)

      if (!isPlaying) {
        audioSource.start()
        isPlaying = true
      }
    },

    resynthesize: function () {
      this.spectrum = synth.spectrum(this.chord, this.amps)
      updateSpectrumPlot(this.spectrum)
      this.play()
    }
  }
}
</script>

<style>
  body {
    font-family: 'Muli', sans-serif;
  }
  #plots {
    width: 778px;
    margin: 0 auto;
    padding: 10px;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    text-align: center;
    background: #ededed;
  }
  .line {
    fill: darkviolet;
    stroke: darkviolet;
    stroke-width: 3;
  }
  input[type=number] {
    width: 50px;
    border: 1px solid lightgray;
    border-radius: 3px;
    margin: 7px;
    background-color: white;
    font-family: 'Muli', sans-serif;
  }
  button {
    border: 1px solid lightgray;
    border-radius: 3px;
    padding: 3px;
    margin-left: 3px;
    font-family: 'Muli', sans-serif;
  }
</style>
