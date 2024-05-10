// message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  email:{
    type: String,
    required :true
  },
  full_name:{
    type: String,
    required : true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
