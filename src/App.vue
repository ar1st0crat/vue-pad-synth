<template>
  <v-app>
    <v-content>
      <ChordPanel/>
      <PadSynthesizer/>
    </v-content>
  </v-app>
</template>

<script>
import ChordPanel from './components/ChordPanel'
import PadSynthesizer from './components/PadSynthesizer'

export default {
  name: 'App',
  components: {
    PadSynthesizer,
    ChordPanel
  },
  data () {
    return {
      //
    }
  }
}
</script>
