
const through = require('through2')
let setImmediate = global.setImmediate

setImmediate = setImmediate || (func => setTimeout(func, 0))

module.exports.testStream = () => through(function (buf, enc, cb) {
  const that = this
  setImmediate(() => {
    that.push(buf)
    cb()
  })
})
