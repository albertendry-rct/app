const mqtt = require('mqtt');

let client = null;

function connect() {
  client = mqtt.connect(process.env.MQTT_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 3000,
  });

  client.on('connect', () => {
    console.log('✅ MQTT terkonek ke HiveMQ');
    // Dengerin status dari semua mesin
    client.subscribe('laundry/+/status');
  });

  client.on('message', (topic, message) => {
    console.log(`📡 [${topic}]: ${message.toString()}`);
  });

  client.on('error', (err) => {
    console.error('❌ MQTT error:', err.message);
  });

  client.on('disconnect', () => {
    console.log('⚠️ MQTT terputus, mencoba reconnect...');
  });
}

// Nyalain mesin via MQTT
function nyalakanMesin(mesinId, menit) {
  if (!client || !client.connected) {
    console.error('MQTT tidak terkonek!');
    return false;
  }
  const topic = `laundry/${mesinId}/perintah`;
  const pesan = JSON.stringify({ aksi: 'NYALAKAN', menit });
  client.publish(topic, pesan, { qos: 1 });
  console.log(`🔌 Perintah dikirim → Mesin ${mesinId} nyala ${menit} menit`);
  return true;
}

module.exports = { connect, nyalakanMesin };