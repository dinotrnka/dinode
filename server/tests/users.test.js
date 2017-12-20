/* eslint-env mocha */
const request = require('supertest');
const expect = require('expect');

const { app } = require('./../server');
const { User } = require('../models/user');
const {
  seedUsers,
  populateUsers,
} = require('./seed/users');

beforeEach(populateUsers);
const apiPrefix = '/api/v1';

describe('/users', () => {
  it('should create a user with valid email and password', (done) => {
    const email = 'testuser@gmail.com';
    const password = 'password';

    request(app)
      .post(`${apiPrefix}/users`)
      .send({ email, password })
      .expect(200)
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.find({ email }).then((users) => {
          expect(users.length).toBe(1);
          expect(users[0].email).toBe(email);
          done();
        }).catch(e => done(e));
      });
  });

  it('should convert uppercased email to lowercase', (done) => {
    const email = 'IAMVERYANGRY@GMAIL.COM';
    const password = 'password';

    request(app)
      .post(`${apiPrefix}/users`)
      .send({ email, password })
      .expect(200)
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.find({ email: email.toLowerCase() }).then((users) => {
          expect(users.length).toBe(1);
          done();
        }).catch(e => done(e));
      });
  });

  it('should trim whitespace from email', (done) => {
    const email = '    iamsosmart@not.really  ';
    const password = 'password';

    request(app)
      .post(`${apiPrefix}/users`)
      .send({ email, password })
      .expect(200)
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.find({ email: email.trim() }).then((users) => {
          expect(users.length).toBe(1);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not create a user with no email', (done) => {
    const password = 'password';

    request(app)
      .post(`${apiPrefix}/users`)
      .send({ password })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Email is required');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.find().then((users) => {
          expect(users.length).toBe(seedUsers.length);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not create a user with no password', (done) => {
    const email = 'email@gmail.com';

    request(app)
      .post(`${apiPrefix}/users`)
      .send({ email })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Password is required');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.find().then((users) => {
          expect(users.length).toBe(seedUsers.length);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not create a user if email is invalid', (done) => {
    const email = 'kajgana##blargh!';
    const password = 'somepass';

    request(app)
      .post(`${apiPrefix}/users`)
      .send({ email, password })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Enter a valid email address');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.find().then((users) => {
          expect(users.length).toBe(seedUsers.length);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not create a user if email already exists', (done) => {
    const email = 'dinaga@gmail.com';
    const password = 'somepass';

    request(app)
      .post(`${apiPrefix}/users`)
      .send({ email, password })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe(`User with email ${email} already exists`);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.find().then((users) => {
          expect(users.length).toBe(seedUsers.length);
          done();
        }).catch(e => done(e));
      });
  });


  it('should not create a user if password has less than 5 characters', (done) => {
    const email = 'some@email.com';
    const password = 'wtf';

    request(app)
      .post(`${apiPrefix}/users`)
      .send({ email, password })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Password must be at least 5 characters long');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.find().then((users) => {
          expect(users.length).toBe(seedUsers.length);
          done();
        }).catch(e => done(e));
      });
  });
});

describe('/users/login', () => {
  it('should log in user with correct credentials and receive access token', (done) => {
    const { _id, email, password } = seedUsers[0];

    request(app)
      .post(`${apiPrefix}/users/login`)
      .send({ email, password })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('expires');
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(_id).then((userInDB) => {
          expect(userInDB.toObject().tokens[1])
            .toBe(res.body.access_token);

          done();
        }).catch(e => done(e));
      });
  });

  it('should not log in user with no email', (done) => {
    const password = 'lubenica';

    request(app)
      .post(`${apiPrefix}/users/login`)
      .send({ password })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Email is required');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });

  it('should not log in user with no password', (done) => {
    const email = 'karabaja@mora.dalje';

    request(app)
      .post(`${apiPrefix}/users/login`)
      .send({ email })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Password is required');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });

  it('should not log in user if email does not exist', (done) => {
    const email = 'some@weird.mail';
    const password = 'whatever';

    request(app)
      .post(`${apiPrefix}/users/login`)
      .send({ email, password })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Invalid credentials');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });

  it('should not log in user if password is incorrect', (done) => {
    const { email } = seedUsers[0];
    const password = 'obviouslywrongpassword';

    request(app)
      .post(`${apiPrefix}/users/login`)
      .send({ email, password })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Invalid credentials');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        done();
      });
  });
});
