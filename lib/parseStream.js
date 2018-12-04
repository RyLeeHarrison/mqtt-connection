const through = require('through2')
const build = require('mqtt-packet').parser

function StreamParser (opts) {
  if (!(this instanceof StreamParser)) {
    return new StreamParser(opts)
  }

  const that = this
  const stream = through.obj(process)
  this.stream = stream
  createParser(opts)

  function process (chunk, enc, cb) {
    that.parser.parse(chunk)
    cb()
  }

  function push (packet) {
    stream.push(packet)
  }

  function createParser (opts) {
    that.parser = build(opts)
    that.parser.on('packet', push)
    that.parser.on('error', that.stream.emit.bind(that.stream, 'error'))
  }

  stream.setOptions = createParser

  return stream
}

module.exports = StreamParser
