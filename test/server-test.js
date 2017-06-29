var pry = require('pryjs')
var assert = require('chai').assert
var app = require('../server')
var request = require('request')

const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const database = require('knex')(configuration);


describe('Server', function(){
  before(function(done){
    this.port = 9876
    this.server = app.listen(this.port, function(err, result){
      if(err) { return done(err) }
      done()
    })
    this.request = request.defaults({
      baseUrl: 'http://localhost:9876'
    })
  })

  after(function(){
    this.server.close()
  })

  it('should exist', function(){
    assert(app)
  })

  describe('GET /', function(){
    it('should return a 200', function(done){
      this.request.get('/', function(error, response){
        if (error) { done(error) }
        assert.equal(response.statusCode, 200)
        done()
      })
    })

    it('should have a body with the name of the application', function(done){
      this.request.get('/', function(error, response){
        if (error) { done(error) }
        assert.include(response.body, app.locals.title)
        done()
      })
    })
  })

  describe('GET /api/secrets/:id', function(){
    beforeEach(function(done) {
      database.raw(
        'INSERT INTO secrets (message, created_at) VALUES (?, ?)',
        ["I open bananas from the wrong side", new Date]
      ).then(function() { done() });
    })

    afterEach(function(done) {
      database.raw('TRUNCATE secrets RESTART IDENTITY')
      .then(function() { done() });
    })

    it('should return a 404 if the resource is not found', function(done){
      this.request.get('/api/secrets/1999', function(error, response){
        if (error) { done(error) }
        assert.equal(response.statusCode, 404)
        done()
      })
    })

    it('should have the id and message from the resource', function(done){
      this.timeout(500000);
      // ^ anki this
      var ourRequest = this.request
      database.raw('SELECT * FROM secrets LIMIT 1')
        .then(function (data) {
          var id = data.rows[0].id
          // ^^ anki this (where in data the info lives)
          var message = data.rows[0].message
          var created_at = data.rows[0].created_at
          ourRequest.get('/api/secrets/' + id, function(error, response){
            if (error) { done(error) }
            
            var parsedSecret = JSON.parse(response.body)
            assert.equal(parsedSecret.id, id)
            assert.equal(parsedSecret.message, message)
            assert.ok(parsedSecret.created_at)
            done()
          })

         })

    })
  })

  describe('POST /api/secrets', function(){
    beforeEach(function(){
      app.locals.secrets = {}
    })

    it('should receive and store data', function(done){
      var message = {
        message: 'I like pineapples!'
      }

      this.request.post('/api/secrets', { form: message }, function(error, response){
        if (error) { done(error) }

        var secretCount = Object.keys(app.locals.secrets).length
        assert.equal(secretCount, 1)
        done()
      })
    })
  })
})
