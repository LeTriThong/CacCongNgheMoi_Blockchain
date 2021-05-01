const express = require('express');

const { getBlockchain, generateNextBlock, getUnspentTxOuts, generateNextBlockWithTransaction, getMyUnspentTransactionOutputs, generateRawNextBlock, getAccountBalance, getSockets, initP2PServer } = require('./src/blockchain');
const { initWallet, getPublicFromWallet } = require('./src/wallet');
const _ = require('lodash');
const { getTransactionPool } = require('./src/transactionPool');

const httpPort = 3001;
const p2pPort = 6001;

const initHttpServer = (httpPort) => {
    const app = express();

    app.use((error, req, res, next) => {
        res.status(400).send(error.message);
    });

    /**
     * Get all block
     */
    app.get('/blocks', (req, res) => {
        res.send(getBlockchain());
    });

    /**
     * Get the block if the node knows the hash of that block
     */
    app.get('/blocks/:hash', (req, res) => {
        const block = _.find(getBlockchain(), {
            'hash': req.params.hash
        });

        res.send(block);
    })

    /**
     * Get the transaction with specific id
     */
    app.get('/transaction/:id', (req, res) => {
        const transaction = _(getBlockchain())
            .map((blocks) => blocks.data)
            .flatten()
            .find({
                'id': req.params.id
            });

        res.send(transaction);
    });

    /**
     * Get all unspent transaction out with the address given
     */
    app.get('/address/:address', (req, res) => {
        const unspentTxOuts = _.filter(getUnspentTxOuts(),
            (uTxO) => uTxO.address === req.params.address);

        res.send({ 'unspentTxOuts': unspentTxOuts });
    });

    /**
     * Get all unspent transaction out
     */
    app.get('/unspentTransactionOutputs', (req, res) => {
        res.send(getUnspentTxOuts());
    });

    /**
     * Get all unspent transaction out owned by the wallet
     * ! Maybe will put this to client
     */
    app.get('/myUnspentTransactionOutputs', (req, res) => {
        res.send(getMyUnspentTransactionOutputs());
    });


    /**
     * Mine a new block
     */
    app.post('/mineBlock', (req, res) => {
        const newBlock = generateNextBlock();

        if (newBlock === null) {
            res.status(400).send('could not generate block');
        } else {
            res.send(newBlock);
        }
    });

    /**
     * Mine a new raw block
     */
    app.post('/mineRawBlock', (req, res) => {
        if (req.body.data == null) {
            res.send('Missing data');
            return;
        }

        const newBlock = generateRawNextBlock(req.body.data);

        if (newBlock === null) {
            res.status(400).send("Could not generate block");
        }
        else {
            res.send(newBlock);
        }

    });

    /**
     * Get the balance of the wallet
     * ! Maybe will put in the client?
     */
    app.get('/balance', (req, res) => {
        const balance = getAccountBalance();
        res.send({ 'balance': balance });
    });

    /**
     * Get the address (public key)
     */
    app.get('/address', (req, res) => {
        const address = getPublicFromWallet();
        res.send({ 'address': address });
    });

    /**
     * Mine the transaction, Typically, when someone wants to include
     *  a transaction to the blockchain (= send coins to some address)
     *  he broadcasts the transaction to the network and hopefully
     *  some node will mine the transaction to the blockchain.
     * 
     * Mine the transaction (which means add the transaction to the blockchain)
     */
    app.post('/mineTransaction', (req, res) => {
        const address = req.body.address;
        const amount = req.body.amount;
        try {
            const resp = generateNextBlockWithTransaction(address, amount);
            res.send(resp);
        } catch (e) {
            console.log(e.message);
            res.status(400).send(e.message);
        }
    });


    /**
     * Send the transaction info - address (public key) & amount
     * --> transaction outputs 
     */
    app.post('/sendTransaction', (req, res) => {
        try {
            const address = req.body.address;
            const amount = req.body.amount;

            if (address === undefined || amount === undefined) {
                throw Error('invalid address or amount');
            }
            const resp = sendTransaction(address, amount);
            res.send(resp);
        } catch (e) {
            console.log(e.message);
            res.status(400).send(e.message);
        }
    });

    /**
     * Get transaction pool info
     */
    app.get('/transactionPool', (req, res) => {
        res.send(getTransactionPool());
    })

    /**
     * Get all p2p sockets
     */
    app.get('/peers', (req, res) => {
        res.send(getSockets().map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });

    app.post('/addPeer', (req, res) => {
        connectToPeers(req.body.peer);
        res.send();
    });

    app.post('/stop', (req, res) => {
        res.send({'msg' : 'stopping server'});
        process.exit();
    });

    app.listen(httpPort, () => {
        console.log("App is listening http on port: " + httpPort)
    });
};

initHttpServer(httpPort);
initP2PServer(p2pPort);
initWallet();