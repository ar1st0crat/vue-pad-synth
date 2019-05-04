<template>
  <div id="main">
    <div>Press key or play chord</div>
    <div id="keyboard"></div>
    <div>
      <div class="pressedNote" v-for="note in chord">{{ note }}</div>
    </div>
    <div id="buttonPanel">
      <select size="1" v-model="chordNote">
        <option v-for="note in NOTES">{{ note }}</option>
      </select>
      <select size="1" v-model="chordOctave">
        <option v-for="octave in [0, 1, 2, 3, 4, 5, 6, 7]">{{ octave }}</option>
      </select>
      <select size="1" v-model="chordType">
        <option v-for="m in ['maj', 'min']">{{ m }}</option>
      </select>
      <button @click="playChord()"> Play </button>
      <button @click="addChord"> Select </button>
      <button @click="clear"> Clear </button>
    </div>
    <div>
      <button class="chord" @click="playChord(chord)" v-for="chord in chordSet">{{ chord }}</button>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'

export default {
  data: () => ({
    note: '',
    chordNote: 'A',
    chordOctave: 4,
    chordType: 'maj',
    chord: [],
    chordSet: []
  }),

  created () {
    this.NOTES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']
    this.keyboard = []

    const NOTE_COUNT = 88

    let octave = 0
    let n = 0
    for (let i = 0; i < NOTE_COUNT; i++) {
      this.keyboard.push(this.NOTES[n] + octave)
      if (this.NOTES[n] === 'B') octave++
      if (++n === this.NOTES.length) n = 0
    }
  },

  mounted () {
    this.update = this.drawKeyboard()
  },

  methods: {
    noteFreq (n) {
      return 440 * Math.pow(2, (n - 49) / 12)
    },

    makeChord (note, octave, minor = false) {
      let idx = this.keyboard.indexOf(note + octave)
      let chord = []
      let middleOffset = minor ? 3 : 4
      if (idx < 0 || idx + 7 >= this.keyboard.length) return chord
      chord.push(this.keyboard[idx])
      chord.push(this.keyboard[idx + middleOffset])
      chord.push(this.keyboard[idx + 7])
      return chord
    },

    addNote (n) {
      let idx = this.chord.indexOf(n)
      if (idx < 0) { this.chord.push(n) } else { this.chord.splice(idx, 1) }

      let notes = this.chord.map(elem => {
        let idx = this.keyboard.indexOf(elem) + 1
        return {
          index: idx,
          frequency: this.noteFreq(idx)
        }
      })

      this.$root.$emit('noteChanged', notes)
    },

    playChord: function (chord) {
      if (chord === undefined) {
        this.chord = this.makeChord(this.chordNote, this.chordOctave, this.chordType === 'min')
      } else {
        let chordNote = chord[0] + (chord.indexOf('#') > 0 ? '#' : '')
        let chordOctave = chord[chord.indexOf('(') + 1]
        this.chord = this.makeChord(chordNote, chordOctave, chord.indexOf('m') > 0)
      }
      let notes = this.chord.map(elem => {
        let idx = this.keyboard.indexOf(elem) + 1
        return {
          index: idx,
          frequency: this.noteFreq(idx)
        }
      })
      this.$root.$emit('noteChanged', notes)
      // hacky way to update keyboard ))
      d3.selectAll('g rect').dispatch('mouseover').dispatch('mouseout')
    },

    addChord: function () {
      let minor = this.chordType === 'min' ? 'm' : ''
      let chordName = `${this.chordNote}${minor}(${this.chordOctave})`
      if (this.chordSet.indexOf(chordName) < 0) {
        this.chordSet.push(chordName)
      }
    },

    clear: function () {
      this.chord = []
      this.chordSet = []
      this.$root.$emit('noteChanged', [])
      // update keyboard
      d3.selectAll('g rect').dispatch('mouseover').dispatch('mouseout')
    },

    drawKeyboard () {
      const WHITE_KEY_WIDTH = 14
      const BLACK_KEY_WIDTH = 10
      const WHITE_KEY_HEIGHT = 90
      const BLACK_KEY_HEIGHT = 56
      const MARGIN_TOP = 20

      let svg = d3
        .select('#keyboard')
        .append('svg')
        .attr('width', 800)
        .attr('height', 120)

      // create tooltip div
      var tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'pressedNote')
        .style('position', 'absolute')
        .style('opacity', 0)

      // white keys

      svg.append('g')
        .selectAll('rect')
        .data(this.keyboard.filter(d => d.indexOf('#') < 0))
        .enter()
        .append('rect')
        .attr('class', 'whiteKey')
        .attr('width', WHITE_KEY_WIDTH)
        .attr('height', WHITE_KEY_HEIGHT)
        .attr('x', (d, i) => (i + 1) * WHITE_KEY_WIDTH)
        .attr('y', MARGIN_TOP)
        .on('click', (d, i, nodes) => {
          this.addNote(d)
          d3.select(nodes[i]).attr('class', 'whiteKey pressed')
        })
        .on('mouseover', (d, i, nodes) => {
          this.note = d
          d3.select(nodes[i]).attr('class', 'whiteKey pressed')
          showTooltip(d)
        })
        .on('mouseout', (d, i, nodes) => {
          if (this.chord.indexOf(d) < 0) {
            d3.select(nodes[i]).attr('class', 'whiteKey')
          }
          hideTooltip()
        })

      // black keys

      let keyPos = WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2

      svg.append('g')
        .selectAll('rect')
        .data(this.keyboard.filter(d => d.indexOf('#') > 0))
        .enter()
        .append('rect')
        .attr('class', 'blackKey')
        .attr('width', BLACK_KEY_WIDTH)
        .attr('height', BLACK_KEY_HEIGHT)
        .attr('x', d => {
          keyPos += WHITE_KEY_WIDTH
          if (d[0] === 'C' || d[0] === 'F') { keyPos += WHITE_KEY_WIDTH }
          return keyPos
        })
        .attr('y', MARGIN_TOP)
        .on('click', (d, i, nodes) => {
          this.addNote(d)
          d3.select(nodes[i]).attr('class', 'blackKey pressed')
        })
        .on('mouseover', (d, i, nodes) => {
          this.note = d
          d3.select(nodes[i]).attr('class', 'blackKey pressed')
          showTooltip(d)
        })
        .on('mouseout', (d, i, nodes) => {
          if (this.chord.indexOf(d) < 0) {
            d3.select(nodes[i]).attr('class', 'blackKey')
          }
          hideTooltip()
        })

      function showTooltip (d) {
        tooltip
          .style('opacity', 0.9)
          .html(d)
          .style('left', (d3.event.pageX + 10) + 'px')
          .style('top', (d3.event.pageY - 20) + 'px')
      }

      function hideTooltip () {
        tooltip
          .style('opacity', 0)
          .style('left', 0)
          .style('top', 0)
      }
    }
  }
}
</script>

<style>
  #main {
    width: 778px;
    margin: 0 auto;
    margin-top: 20px;
    padding: 10px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    text-align: center;
    background: #ededed;
    font-family: 'Muli', sans-serif;
  }
  .blackKey {
    stroke: black;
    fill: black;
  }
  .whiteKey {
    stroke: black;
    fill: white;
  }
  .pressed {
    fill: lightpink;
  }
  .pressedNote {
    display: inline-block;
    width: 40px;
    height: 40px;
    color: white;
    border-radius: 50%;
    margin-left: 5px;
    margin-right: 5px;
    margin-top: 10px;
    margin-bottom: 10px;
    background-color: lightpink;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
  }
  #buttonPanel {
    margin-top: 12px;
    margin-bottom: 10px;
  }
  select {
    -webkit-appearance: menulist-button;
    -moz-appearance: menulist-button;
    appearance: menulist-button;
    border: 1px solid lightgray;
    border-radius: 4px;
    width: 48px;
    height: 40px;
    margin-right: 7px;
    outline: none;
    background-color: white;
  }
  .chord {
    margin: 10px;
    border: 1px solid lightgray;
    border-radius: 10px;
    color: white;
    background-color: darkviolet;
    outline: none;
  }
  button {
    width: 60px;
    height: 40px;
    border: 1px solid lightgray;
    border-radius: 5px;
    color: white;
    background-color: darkgray;
    outline: none;
  }
  button:hover {
    background-color: white;
    color: black;
  }
</style>
