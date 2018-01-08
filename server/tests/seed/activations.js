const { ObjectID } = require('mongodb');

const { Activation } = require('../../models/activation');
const { seed_users } = require('./users');

const activation_0_id = new ObjectID();

const seed_activations = [{
  _id: activation_0_id,
  _owner: seed_users[2]._id,
  // Code is automatically generated in Activation pre('save') method
}];

function populateActivations(done) {
  Activation.remove({}).then(() => {
    const activation_0 = new Activation(seed_activations[0]).save();
    return Promise.all([activation_0]);
  }).then((saved_activations) => {
    // Setting 'code' value of generated activation to exported variable
    // 'seed_activations', so it can be fetched and used in tests
    seed_activations[0].code = saved_activations[0].code;
    done();
  });
}

module.exports = {
  seed_activations,
  populateActivations,
};
