
var util = require('util')
var fs = require('fs')
var writeFile = util.promisify(fs.writeFile)


module.exports = ({fpath, env}) => {

  var fields = require(fpath.fields)

  var write = () => (
    fields[env].action.since = new Date().getTime()
    ,
    writeFile(fpath.fields, JSON.stringify(fields, null, 2), 'utf8')
  )

  return {write}
}
