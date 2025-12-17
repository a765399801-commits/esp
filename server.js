// server.js
const mqtt = require('mqtt');
const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');

/* MQTT 配置 */
const MQTT_URL = 'mqtts://ac6ca910.ala.cn-hangzhou.emqxsl.cn:8883';
const mqttClient = mqtt.connect(MQTT_URL, {
  username: 'keven',
  password: 'ck12345678',
  clientId: 'node_bridge_' + Math.random().toString(16).slice(2),
  clean: true
});

mqttClient.on('connect', () => console.log('✅ MQTT connected'));
mqttClient.subscribe('device/+/state');

/* WebSocket */
const wss = new WebSocket.Server({ port: 3000 }); // Render 会自动代理端口
wss.on('connection', ws => {
  console.log('📱 小程序连接');
  ws.on('message', msg => {
    const { topic, payload } = JSON.parse(msg);
    mqttClient.publish(topic, payload);
  });
});

mqttClient.on('message', (topic, message) => {
  const data = JSON.stringify({ topic, payload: message.toString() });
  wss.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(data));
});

/* HTTP API */
const app = express();
app.use(bodyParser.json());
app.post('/api/publish', (req, res) => {
  const { topic, payload } = req.body;
  mqttClient.publish(topic, payload);
  res.send({ status: 'ok', topic, payload });
});

app.listen(4000, () => console.log('🚀 API server on port 4000'));
