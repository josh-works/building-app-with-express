var express = require('express')
var app = express()
var bodyParser = require('body-parser')

const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.set('port', process.env.PORT || 3000)
app.locals.title = 'Secret Box'
app.locals.secrets = {
  wowowow: 'I am a banana'
}
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function(request, response) {
  response.send(app.locals.title)
})

app.get('/api/secrets/:id', function(request, response){
  var id = request.params.id
  // console.log("id is: ", id);
  database.raw("SELECT * from secrets where id=?", [id])
    .then(function(data){
      // console.log(data.rows);
      if (data.rowCount == 0) { return response.sendStatus(404)}
      var secret = data.rows[0]
      response.json( secret )
    })

})

app.post('/api/secrets', function(request, response){
  var id = Date.now()
  var message = request.body.message

  if (!message) {
    return response.status(422).send({ error: "No message property provided!"})
  }

  app.locals.secrets[id] = message
  response.status(201).json({ id, message })
})

if(!module.parent) {
  app.listen(app.get('port'), function() {
    console.log(app.locals.title + " is running on " + app.get('port') + ".")
  })
}

module.exports = app
