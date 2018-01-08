const { Activation } = require('../../models/activation');

function populateActivations(done) {
  Activation.remove({}).then(() => done());
}

module.exports = {
  populateActivations,
};
