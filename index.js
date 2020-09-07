
const WebSocket = require("ws");
const WebSocketServer = require("ws").Server;
const http = require("http");
const express = require("express");
const app = express();
const port = process.env.PORT || 9155;

app.use(express.static(__dirname + "/"));

const server = http.createServer(app);
server.listen(port);
// console.log("http server listening on %d", port);

const wss = new WebSocketServer({server: server});
// console.log("websocket server created");

const axios = require('axios');

wss.on('connection', function connection(ws) {
    const language = ['en', 'ru', 'es', 'fr', 'it', 'de', 'ja'];
    // console.log("новое соединение ");

    ws.on('message', function incoming(data) {
      // console.log('получено сообщение: ' + data);

      if (data.includes('|||')) {

        const [name, lang] = data.split('|||');
        ws.name = name.slice(0, 8);
        ws.lang = lang.slice(0, 2);
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(ws.name + ': here');
          }
        });
        
      } else {
        const requestLanguage = new Set();
        wss.clients.forEach(inst => requestLanguage.add(inst.lang));
        // console.log(requestLanguage);
        requestLanguage.delete(ws.lang);
        // console.log(requestLanguage);

        for (let itemLang of requestLanguage) {

          let url = `api/v1.5/tr.json/translate?key=trnsl.1.1.20200217T121112Z.6f97943f3d92eae7.af92be793cd3258883e9e29290f7e7129bfcb43f&lang=${ws.lang}-${itemLang}&text=${encodeURIComponent(data)}`;
          let config = {
            baseURL: 'https://translate.yandex.net/'
          };
          axios.get(url, config)
            .then(response => {
              wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN && client.lang === itemLang) {
                  client.send(ws.name + ': ' + response.data.text.join());
                }
              });
            })
            .catch(error => {
              // console.log(error);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(ws.name + ': Translation Error');
              }
            });
        }

        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN && client !== ws && ws.lang === client.lang) {
            client.send(ws.name + ': ' + data);
          }
        });

      }

    });

    ws.on('close', function close() {
      // console.log('соединение закрыто ' + ws.name);
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client !== ws) {
          client.send(ws.name + ': done');
        }
      });
    });
});
