const stream = require('stream')
const { writeToStream } = require('mqtt-packet')

function StreamGenerator (output, opts) {
  if (!(this instanceof StreamGenerator)) {
    return new StreamGenerator(output, opts)
  }

  const that = this
  this.opts = opts || {}
  const input = new stream.Writable({ objectMode: true, write })

  function write (chunk, enc, cb) {
    if (writeToStream(chunk, output, that.opts)) {
      cb()
    } else {
      output.once('drain', cb)
    }
  }

  input.setOptions = opts => {
    that.opts = opts
  }

  return input
}

module.exports = StreamGenerator
