// server.js（Render 正确版）
const mqtt = require('mqtt');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');

/* ========= MQTT ========= */
const MQTT_URL = 'mqtts://ac6ca910.ala.cn-hangzhou.emqxsl.cn:8883';

const mqttClient = mqtt.connect(MQTT_URL, {
  username: 'keven',
  password: 'ck12345678',
  clientId: 'node_bridge_' + Math.random().toString(16).slice(2),
  clean: true
});


mqttClient.on('connect', () => {
  console.log('✅ MQTT connected');
  mqttClient.subscribe('device/#');
});

/* ========= HTTP ========= */
const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('ESP MQTT Bridge Running ✅');
});

app.post('/api/publish', (req, res) => {
  const { topic, payload } = req.body;
  mqttClient.publish(topic, payload);
  res.send({ ok: true });
});

/* ========= Server ========= */
const server = http.createServer(app);

/* ========= WebSocket ========= */
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('📱 小程序 WebSocket 已连接');

  ws.on('message', msg => {
    try {
      const { topic, payload } = JSON.parse(msg);
      mqttClient.publish(topic, payload);
    } catch (e) {
      console.error('WS message error', e);
    }
  });
});

/* MQTT → WS */
mqttClient.on('message', (topic, message) => {
  const data = JSON.stringify({
    topic,
    payload: message.toString()
  });

  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(data);
    }
  });
});

/* ========= Listen ========= */
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log('🚀 Server listening on', PORT);
});




