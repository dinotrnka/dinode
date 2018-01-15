const { ObjectID } = require('mongodb');

const { Activation } = require('../../models/activation');
const { seed_users } = require('./users');

const activation_0_id = new ObjectID();
const activation_1_id = new ObjectID();

const seed_activations = [{
  _id: activation_0_id,
  _owner: seed_users[2]._id,
  // Code is not set, so it will be automatically generated in Activation pre('save') method
}, {
  _id: activation_1_id,
  _owner: seed_users[3]._id,
  code: 'SzUIXx62P9Q5DTM5qJ5TpWZ6Lj0EvT_1510117078', // Hardcoded to be expired
}];

function populateActivations(done) {
  Activation.remove({}).then(() => {
    const activation_0 = new Activation(seed_activations[0]).save();
    const activation_1 = new Activation(seed_activations[1]).save();
    return Promise.all([activation_0, activation_1]);
  }).then((saved_activations) => {
    // Setting automatically generated 'code' value to exported variable
    // 'seed_activations', so it can be fetched and used in tests later
    seed_activations[0].code = saved_activations[0].code;
    done();
  });
}

module.exports = {
  seed_activations,
  populateActivations,
};
