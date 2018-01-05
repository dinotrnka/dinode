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
      .expect((res) => {
        expect(res.body.success).toBe('Registration successful');
      })
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const users = await User.find({ email });
          expect(users.length).toBe(1);
          expect(users[0].email).toBe(email);
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should convert uppercased email to lowercase', (done) => {
    const email = 'IAMVERYANGRY@GMAIL.COM';
    const password = 'password';

    request(app)
      .post(`${apiPrefix}/users`)
      .send({ email, password })
      .expect(200)
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const users = await User.find({ email: email.toLowerCase() });
          expect(users.length).toBe(1);
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should trim whitespace from email', (done) => {
    const email = '    iamsosmart@not.really  ';
    const password = 'password';

    request(app)
      .post(`${apiPrefix}/users`)
      .send({ email, password })
      .expect(200)
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const users = await User.find({ email: email.trim() });
          expect(users.length).toBe(1);
          done();
        } catch (e) {
          done(e);
        }
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
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const users = await User.find();
          expect(users.length).toBe(seedUsers.length);
          done();
        } catch (e) {
          done(e);
        }
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
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const users = await User.find();
          expect(users.length).toBe(seedUsers.length);
          done();
        } catch (e) {
          done(e);
        }
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
      .end(async (err) => {
        if (err) {
          return done(err);
        }
        try {
          const users = await User.find();
          expect(users.length).toBe(seedUsers.length);
          done();
        } catch (e) {
          done(e);
        }
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
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const users = await User.find();
          expect(users.length).toBe(seedUsers.length);
          done();
        } catch (e) {
          done(e);
        }
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
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const users = await User.find();
          expect(users.length).toBe(seedUsers.length);
          done();
        } catch (e) {
          done(e);
        }
      });
  });
});

describe('/users/logout', () => {
  it('should remove access token on logout', (done) => {
    request(app)
      .post(`${apiPrefix}/users/logout`)
      .set('access_token', seedUsers[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe('Logged out');
      })
      .end(async (err) => {
        if (err) {
          return done(err);
        }

        try {
          const user = await User.findById(seedUsers[0]._id);
          expect(user.tokens.length).toBe(1); // Refresh token remains active
          done();
        } catch (e) {
          done(e);
        }
      });
  });
});

describe('/users/login', () => {
  it('should log in user with correct credentials and receive tokens', (done) => {
    const { _id, email, password } = seedUsers[0];

    request(app)
      .post(`${apiPrefix}/users/login`)
      .send({ email, password })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('refresh_token');
        expect(res.body).toHaveProperty('expires');
      })
      .end(async (err, res) => {
        if (err) {
          return done(err);
        }

        try {
          const user = await User.findById(_id);
          expect(user.toObject().tokens[2]).toMatchObject({
            type: 'access',
            token: res.body.access_token,
          });
          expect(user.toObject().tokens[3]).toMatchObject({
            type: 'refresh',
            token: res.body.refresh_token,
          });
          done();
        } catch (e) {
          done(e);
        }
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

describe('/users/refresh_token', () => {
  it('should refresh token with correct refresh token value', (done) => {
    const refresh_token = seedUsers[0].tokens[1].token;

    request(app)
      .post(`${apiPrefix}/users/refresh_token`)
      .send({ refresh_token })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('refresh_token');
        expect(res.body).toHaveProperty('expires');
      })
      .end(async (err, res) => {
        if (err) {
          return done(err);
        }

        try {
          const user = await User.findByToken('refresh', res.body.refresh_token);
          expect(user.toObject().tokens[1]).toMatchObject({
            type: 'access',
            token: res.body.access_token,
          });
          expect(user.toObject().tokens[2]).toMatchObject({
            type: 'refresh',
            token: res.body.refresh_token,
          });
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should not refresh token if refresh token is not provided', (done) => {
    request(app)
      .post(`${apiPrefix}/users/refresh_token`)
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Refresh token is required');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });

  it('should not refresh token if refresh token is invalid', (done) => {
    const refresh_token = 'What am I doing here?';

    request(app)
      .post(`${apiPrefix}/users/refresh_token`)
      .send({ refresh_token })
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

  it('should not refresh token if refresh token does not exist', (done) => {
    const refresh_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1YTRlNGZiYWVjZThmNjU0YzM2NWE2MDAiLCJpYXQiOjE1MTUxMDUyNjAsImV4cCI6MTUxNTcxMDA2MH0.QOxwVuPq-bYxm-f5bbbYF74DFOIVgWTHl_QAfDYPJbk';

    request(app)
      .post(`${apiPrefix}/users/refresh_token`)
      .send({ refresh_token })
      .expect(401)
      .expect((res) => {
        expect(res.body.error).toBe('Invalid refresh token');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });

  it('should not refresh token with access token', (done) => {
    const refresh_token = seedUsers[0].tokens[0].token;
    request(app)
      .post(`${apiPrefix}/users/refresh_token`)
      .send({ refresh_token })
      .expect(401)
      .expect((res) => {
        expect(res.body.error).toBe('Invalid refresh token');
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });
});

describe('/users/change_password', () => {
  it('should change to new password if old password is correct', (done) => {
    const old_password = 'dinaga123';
    const new_password = 'dinaga456';

    request(app)
      .post(`${apiPrefix}/users/change_password`)
      .set('access_token', seedUsers[0].tokens[0].token)
      .send({ old_password, new_password })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe('Password successfully changed');
      })
      .end(async (err) => {
        if (err) {
          return done(err);
        }
        try {
          const user = await User.findById(seedUsers[0]._id);
          const passwordIsCorrect = await user.checkPassword(new_password);
          expect(passwordIsCorrect).toBeTruthy();
          done();
        } catch (e) {
          done(e);
        }
      });
  });
});
