/* eslint-env mocha */
const request = require('supertest');
const expect = require('expect');

const { app } = require('./../server');
const { Note } = require('../models/note');
const { seedUsers } = require('./seed/users');
const { seedNotes, populateNotes } = require('./seed/notes');

beforeEach(populateNotes);
const apiPrefix = '/api/v1';

describe('/notes', () => {
  it('should create a note', (done) => {
    const text = 'My name is Dino. Trnka Dino.';

    request(app)
      .post(`${apiPrefix}/notes`)
      .set('access_token', seedUsers[0].tokens[0])
      .send({ text })
      .expect(200)
      .end((err) => {
        if (err) {
          return done(err);
        }

        Note.find({ text }).then((notes) => {
          expect(notes.length).toBe(1);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not create a note without text', (done) => {
    request(app)
      .post(`${apiPrefix}/notes`)
      .set('access_token', seedUsers[0].tokens[0])
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Text is required');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        Note.find({}).then((notes) => {
          expect(notes.length).toBe(seedNotes.length);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not create a note with expired access token', (done) => {
    request(app)
      .post(`${apiPrefix}/notes`)
      .set('access_token', seedUsers[1].tokens[0]) // This token expired
      .send({ })
      .expect(401)
      .expect((res) => {
        expect(res.body.error).toBe('Access token expired');
      })
      .end(done);
  });

  it('should not create a note with invalid access token', (done) => {
    request(app)
      .post(`${apiPrefix}/notes`)
      .set('access_token', 'somestupidtoken')
      .send({})
      .expect(401)
      .expect((res) => {
        expect(res.body.error).toBe('Invalid access token');
      })
      .end(done);
  });
});
