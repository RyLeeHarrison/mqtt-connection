const Duplexify = require('duplexify')
const inherits = require('inherits')

const generateStream = require('./lib/generateStream')
const parseStream = require('./lib/parseStream')
const writeToStream = require('./lib/writeToStream')

function emitPacket (packet) {
  this.emit(packet.cmd, packet)
}

class Connection {
  constructor (duplex, opts, cb) {
    if (!(this instanceof Connection)) {
      return new Connection(duplex, opts)
    }

    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }

    opts = opts || {}

    this._generator = writeToStream(duplex, opts)
    this._parser = parseStream(opts)

    // defer piping, so consumer can attach event listeners
    // otherwise we might lose events
    process.nextTick(() => {
      duplex.pipe(this._parser)
    })

    this._generator.on('error', this.emit.bind(this, 'error'))
    this._parser.on('error', this.emit.bind(this, 'error'))

    this.stream = duplex

    duplex.on('error', this.emit.bind(this, 'error'))
    duplex.on('close', this.emit.bind(this, 'close'))

    Duplexify.call(this, this._generator, this._parser, {
      objectMode: true
    })

    // MQTT.js basic default
    if (opts.notData !== true) {
      const that = this
      this.once('data', connectPacket => {
        that.setOptions(connectPacket)
        that.on('data', emitPacket)
        if (cb) {
          cb()
        }
        that.emit('data', connectPacket)
      })
    }
  }

  destroy () {
    if (this.stream.destroy) this.stream.destroy()
    else this.stream.end()
  }

  setOptions (opts) {
    this.options = opts
    this._parser.setOptions(opts)
    this._generator.setOptions(opts)
  }
}

inherits(Connection, Duplexify)

;['connect',
  'connack',
  'publish',
  'puback',
  'pubrec',
  'pubrel',
  'pubcomp',
  'subscribe',
  'suback',
  'unsubscribe',
  'unsuback',
  'pingreq',
  'pingresp',
  'disconnect',
  'auth'
].forEach(cmd => {
  Connection.prototype[cmd] = function (opts = {}, cb) {
    opts.cmd = cmd

    // Flush the buffer if needed
    // UGLY hack, we should listen for the 'drain' event
    // and start writing again, but this works too
    this.write(opts)
    if (cb) setImmediate(cb)
  }
})

module.exports = Connection
module.exports.parseStream = parseStream
module.exports.generateStream = generateStream
