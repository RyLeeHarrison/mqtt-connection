const { Buffer } = require('safe-buffer')
const through = require('through2')
const { generate } = require('mqtt-packet')

const empty = Buffer.allocUnsafe(0)

function generateStream (opts) {
  const stream = through.obj(process)

  function process (chunk, enc, cb) {
    let packet = empty

    try {
      packet = generate(chunk, opts)
    } catch (err) {
      this.emit('error', err)
      return
    }

    this.push(packet)
    cb()
  }

  return stream
}

module.exports = generateStream
