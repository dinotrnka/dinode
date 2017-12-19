/* eslint-env mocha */
const request = require('supertest');
const expect = require('expect');

const { app } = require('./../server');
const { Note } = require('../models/note');
const {
  seedNotes,
  populateNotes,
} = require('./seed/notes');

beforeEach(populateNotes);
const apiPrefix = '/api/v1';

describe('/notes', () => {
  it('should create a note', (done) => {
    const text = 'Hello there! How are you?';

    request(app)
      .post(`${apiPrefix}/notes`)
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
});
