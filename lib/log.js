
module.exports = () => {

  var success = (message) => [
    new Date().toString(),
    message,
  ].join(' ')

  var error = (res, body) => [
    res.statusCode,
    res.statusMessage,
    typeof body === 'object' ? JSON.stringify(body) : body
  ].join(' ')


  return {success, error}
}
