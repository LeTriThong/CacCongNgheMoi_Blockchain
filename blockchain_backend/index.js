const express = require('express');

const bc = require('./src/blockchain');
const p2p = require('./src/p2p');
const { initWallet } = require('./src/wallet');

const httpPort = 3001;
const p2pPort = 6001;

const initHttpServer = (httpPort) => {
    const app = express();
    // app.use(bodyParser.json());

    app.use((req, res, next) => {
        res.status(400).json({
            error_message: 'Bad request'
        });
    });

    app.get('/blocks', (req, res) => {
        res.send(bc.getBlockchain());
    });

    app.post('/mineBlock', (req, res) => {
        const newBlock = bc.generateNextBlock(req.body.data);
        res.send(newBlock);
    });

    app.post('/mineRawBlock', (req, res) => {
        if (req.body.data === null) {
            res.send('Missing data');
            return;
        }

        const newBlock = bc.generateRawNextBlock(req.body.data);

        if (newBlock === null) {
            res.status(400).send("Could not generate block");
        }
        else {
            res.send(newBlock);
        }

    });

    app.get('/balance', (req, res) => {
        const balance = getAccountBalance();
        res.send({'balance': balance});
    });

    app.post('/mineTransaction', (req, res) => {
        const address = req.body.address;
        const amount = req.body.amount;
        try {
            const resp = generatenextBlockWithTransaction(address, amount);
            res.send(resp);
        } catch (e) {
            console.log(e.message);
            res.status(400).send(e.message);
        }
    });

    app.get('/peers', (req, res) => {
        res.send(p2p.getSockets().map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });

    app.post('/addPeer', (req, res) => {
        connectToPeers(req.body.peer);
        res.send();
    });

    app.post('/sendTransaction', (req,res) => {

    });

    app.listen(httpPort, () => {
        console.log("App is listening http on port: " + httpPort)
    });
};

initHttpServer(httpPort);
p2p.initP2PServer(p2pPort);
initWallet();