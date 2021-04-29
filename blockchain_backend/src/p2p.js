const WebSocket = require('ws');
const { Block, getBlockchain, getLatestBlock, addBlockToChain, replaceChain } = require('./blockchain');



/**
 * @type {WebSocket[]}
 * List of sockets
 */
const sockets = [];

/**
 * @type {Enumerator<number>}
 * Enum of message type
 */
const MessageTypeEnum = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2,
    QUERY_TRANSACTION_POOL: 3,
    RESPONSE_TRANSACTION_POOL: 4
}


class Message {
    /**
     * @type {MessageTypeEnum}
     */
    type

    /**
     * @type {string}
     */
    data

    constructor(type, data) {
        this.type = type;
        this.data = data;
    }

    /**
     * Return a Message object
     * @param {string} json 
     * @returns Message object
     */
    static from(json) {
        try {
            return Object.assign(new Message(), json);
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }
}

/**
 * Init a P2P server
 * @param {number} p2pPort 
 */
const initP2PServer = p2pPort => {
    const server = new WebSocket.Server({ port: p2pPort });
    server.on('connection', ws => {
        initConnection(ws);
    });
    console.log('App is listening websocket - P2P port on: ' + p2pPort);
}

const getSockets = () => {
    return sockets;
}

const responseTransactionPoolMsg = () => ({
    'type': MessageType.RESPONSE_TRANSACTION_POOL,
    'data': JSON.stringify(getTransactionPool())
});

const queryTransactionPoolMsg = () => ({
    'type': MessageType.QUERY_TRANSACTION_POOL,
    'data': null
});

/**
 * Init a connection with the given websocket
 * @param {WebSocket} ws 
 */
const initConnection = ws => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());

    setTimeout(() => {
        broadcast(queryTransactionPoolMsg());
    }, 500)
}

const JSONToObject = (data) => {
    try {
        return JSON.parse(data);
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

/**
 * Init message handler, it will catch the message that websocket received
 * @param {WebSocket} ws 
 */
const initMessageHandler = ws => {
    ws.on('message', data => {
        try {

            const message = Message.from(data);

            if (message === null) {
                console.log('Unable to parse JSON message: ' + data);
                return;
            }

            console.log('Received message: ' + JSON.stringify(message));

            //For each message type, handle it
            switch (message.type) {
                case MessageTypeEnum.QUERY_LATEST:
                    write(ws, responseLatestMessage());
                    break;
                case MessageTypeEnum.QUERY_ALL:
                    write(ws, responseChainMessage());
                    break;
                case MessageTypeEnum.RESPONSE_BLOCKCHAIN:
                    const receiveBlocksJSON = JSONToObject(message.data);

                    if (receiveBlocksJSON === null) {
                        console.log('Invalid blocks received: ');
                        console.log(message.data);
                        break;
                    }

                    let receiveBlocks = [];
                    receiveBlocksJSON.forEach((block) => {
                        let newBlock = new Block(block.index, block.hash, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);
                        receiveBlocks.push(newBlock);
                    })

                    handleBlockchainResponse(receivedBlocks);
                    break;
                case MessageTypeEnum.QUERY_TRANSACTION_POOL:
                    write(ws, responseTransactionPoolMsg());
                    break;
                case MessageTypeEnum.RESPONSE_TRANSACTION_POOL:
                    const receivedTransactions = JSON.parse(message.data);
                    if (receivedTransactions === null) {
                        console.log('invalid transaction received: %s', JSON.stringify(message.data));
                        break;
                    }
                    receivedTransactions.forEach((transaction) => {
                        try {
                            handleReceivedTransaction(transaction);
                            // if no error is thrown, transaction was indeed added to the pool
                            // let's broadcast transaction pool
                            broadcastTransactionPool();
                        } catch (e) {
                            console.log(e.message);
                        }
                    });
                    break;
            }
        }
        catch (e) {
            console.log(e);
        }
    })
}
/**
 * The websocket send the message 
 * @param {WebSocket} ws 
 * @param {Message} message 
 * @returns 
 */
const write = (ws, message) => ws.send(JSON.stringify(message));

const broadcast = (message) => sockets.forEach(socket => write(socket, message));


const queryChainLengthMsg = () => {
    let data = {
        'type': MessageTypeEnum.QUERY_LATEST,
        'data': null
    }

    return Message.from(data);
}

const queryAllMessage = () => {
    let data = {
        'type': MessageTypeEnum.QUERY_ALL,
        'data': null
    }

    return Message.from(data);
}

const responseChainMessage = () => {
    let data = {
        'type': MessageTypeEnum.RESPONSE_BLOCKCHAIN,
        'data': JSON.stringify(getBlockchain())
    }
    return Message.from(data);

}

const responseLatestMessage = () => {

    let data = {
        'type': MessageTypeEnum.QUERY_ALL,
        'data': JSON.stringify(getLatestBlock())
    }
    return Message.from(data);

}
/**
 * Init a handler that will exec when catch errors
 * @param {WebSocket} ws 
 */
const initErrorHandler = ws => {
    const closeConnection = closingWebSocket => {
        console.log('Connection failed to peer: ' + closingWebSocket.url);
        sockets.splice(sockets.indexOf(closingWebSocket), 1);
    }

    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
}

/**
 * Init handler that execute after receiving a blockchain
 * @param {Block[]} receivedBlocks 
 */
const handleBlockchainResponse = receivedBlocks => {
    if (receivedBlocks.length === 0) {
        console.log('received block chain size of 0');
        return;
    }
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    if (!isValidBlockStructure(latestBlockReceived)) {
        console.log('block structuture not valid');
        return;
    }

    const latestBlockHeld = getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind. We got: '
            + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        console.log('Prepare to add the block...');
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            if (addBlockToChain(latestBlockReceived)) {
                broadcast(responseLatestMessage());
            }
        } else if (receivedBlocks.length === 1) {
            console.log('We have to query the chain from our peer');
            broadcast(queryAllMessage());
        } else {
            console.log('Received blockchain is longer than current blockchain, replacing...');
            replaceChain(receivedBlocks);
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
};

const broadcastTransactionPool = () => {
    broadcast(responseTransactionPoolMsg());
};

const broadcastLatest = () => {
    broadcast(responseLatestMessage());
};
/**
 * Connect to a peer
 * @param {string} newPeer 
 */
const connectToPeers = newPeer => {
    const ws = new WebSocket(newPeer);
    ws.on('open', () => {
        initConnection(ws);
    });
    ws.on('error', () => {
        console.log('connection failed');
    });
};

module.exports = { connectToPeers, broadcastTransactionPool, broadcastLatest, initP2PServer, getSockets };