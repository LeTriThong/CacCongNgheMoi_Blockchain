const express = require('express');
const bodyParser = require('body-parser');

const bc = require('./src/blockchain');
const p2p = require('./src/p2p')

const httpPort = 3001;
const p2pPort = 6001;

const initHttpServer = (httpPort) => {
    const app = express();
    // app.use(bodyParser.json());

    app.get('/blocks', (req, res) => {
        res.send(bc.getBlockchain());
    });

    app.post('/mineBlock', (req, res) => {
        
        const newBlock = bc.generateNextBlock(req.body.data);
        res.send(newBlock);
    });

    app.get('/peers', (req, res) => {
        res.send(p2p.getSockets().map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });

    app.post('/addPeer', (req, res) => {
        connectToPeers(req.body.peer);
        res.send();
    });

    app.listen(httpPort, () => {
        console.log("App is listening http on port: " + httpPort)
    });
};

initHttpServer(httpPort);
p2p.initP2PServer(p2pPort);