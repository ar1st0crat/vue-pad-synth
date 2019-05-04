class Fft {
  constructor (size) {
    this.size = size
    let tblSize = Math.floor(Math.log(size, 2))
    this.cosTbl = Array(tblSize).fill(0)
    this.sinTbl = Array(tblSize).fill(0)
    for (var i = 1, pos = 0; i < this.size; i *= 2, pos++) {
      this.cosTbl[pos] = Math.cos(2 * Math.PI * i / this.size)
      this.sinTbl[pos] = Math.sin(2 * Math.PI * i / this.size)
    }
  }
  inverse (re, im) {
    var t1, t2
    var i, j
    var L, M, S
    L = this.size
    M = this.size / 2
    S = this.size - 1
    var ti = 0
    while (L >= 2) {
      var l = L >> 1
      var u1 = 1.0
      var u2 = 0.0
      var c = this.cosTbl[ti]
      var s = this.sinTbl[ti]
      ti++
      for (j = 0; j < l; j++) {
        for (i = j; i < this.size; i += L) {
          var p = i + l
          t1 = re[i] + re[p]
          t2 = im[i] + im[p]
          var t3 = re[i] - re[p]
          var t4 = im[i] - im[p]
          re[p] = t3 * u1 - t4 * u2
          im[p] = t4 * u1 + t3 * u2
          re[i] = t1
          im[i] = t2
        }
        var u3 = u1 * c - u2 * s
        u2 = u2 * c + u1 * s
        u1 = u3
      }
      L >>= 1
    }
    j = 0
    for (i = 0; i < S; i++) {
      if (i > j) {
        t1 = re[j]
        t2 = im[j]
        re[j] = re[i]
        im[j] = im[i]
        re[i] = t1
        im[i] = t2
      }
      var k = M
      while (j >= k) {
        j -= k
        k >>= 1
      }
      j += k
    }
  }
}

export default Fft
