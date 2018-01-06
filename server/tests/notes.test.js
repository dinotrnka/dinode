/* eslint-env mocha */
const request = require('supertest');
const expect = require('expect');

const { app } = require('./../server');
const { Note } = require('../models/note');
const { User } = require('../models/user');
const { seed_users, populateUsers } = require('./seed/users');
const { seed_notes, populateNotes } = require('./seed/notes');

const URL_API = '/api/v1';
const URL_NOTES = '/notes';

beforeEach(populateUsers);
beforeEach(populateNotes);

describe(URL_NOTES, () => {
  it('should create a note', (done) => {
    const text = 'My name is Dino. Trnka Dino.';

    request(app)
      .post(URL_API + URL_NOTES)
      .set('access_token', seed_users[0].tokens[0].token)
      .send({ text })
      .expect(200)
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const notes = await Note.find({ text });
          expect(notes.length).toBe(1);
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should not create a note without text', (done) => {
    request(app)
      .post(URL_API + URL_NOTES)
      .set('access_token', seed_users[0].tokens[0].token)
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Text is required');
      })
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const notes = await Note.find({});
          expect(notes.length).toBe(seed_notes.length);
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should not create a note if token is invalid', (done) => {
    request(app)
      .post(URL_API + URL_NOTES)
      .set('access_token', 'somestupidtoken')
      .expect(401)
      .expect((res) => {
        expect(res.body.error).toBe('Invalid access token');
      })
      .end(done);
  });

  it('should not create a note with refresh token', (done) => {
    request(app)
      .post(URL_API + URL_NOTES)
      .set('access_token', seed_users[0].tokens[1].token)
      .expect(401)
      .expect((res) => {
        expect(res.body.error).toBe('Invalid access token');
      })
      .end(done);
  });

  it('should not create a note if token expired but logout instead', (done) => {
    request(app)
      .post(URL_API + URL_NOTES)
      .set('access_token', seed_users[1].tokens[0].token)
      .expect(401)
      .expect((res) => {
        expect(res.body.error).toBe('Invalid access token');
      })
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const user = await User.findById(seed_users[1]._id);
          expect(user.tokens.length).toBe(1); // Refresh token remains active
          done();
        } catch (e) {
          done(e);
        }
      });
  });
});
