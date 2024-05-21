const predictClassification = require('../services/inferenceService');
const crypto = require('crypto');
const storeData = require('../services/storeData');
const { Firestore } = require('@google-cloud/firestore');

 
async function postPredictHandler(request, h) {
  const { image } = request.payload;
  const { model } = request.server.app;
 
  const { confidenceScore, label, explanation, suggestion } = await predictClassification(model, image);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
 
  const data = {
    "id": id,
    "result": label,
    "suggestion": suggestion,
    "createdAt": createdAt
  }
 
  await storeData(id, data);
  
  const response = h.response({
    status: 'success',
    message: confidenceScore > 99 ? 'Model is predicted successfully' : 'Model is predicted successfully but under threshold. Please use the correct picture',
    data
  })
  response.code(201);
  return response;
}

const firestore = new Firestore();

async function getPredictHandler(request, h) {
  try {
    const snapshot = await firestore.collection('prediction').get();
    const predictHistories = snapshot.docs.map(doc => doc.data());
    return h.response(predictHistories).code(200);
  } catch (error) {
    console.error('Error fetching prediction histories:', error);
    return h.response({ message: 'Internal server error' }).code(500);
  }
}
 
module.exports = {postPredictHandler, getPredictHandler};