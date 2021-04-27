const WebSocket = require('ws');

// import { getBlockchain, getLatestBlock } from './blockchain';

const bc = require('./blockchain');

const sockets = [];

const MessageTypeEnum = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2,
    QUERY_TRANSACTION_POOL: 3,
    RESPONSE_TRANSACTION_POOL: 4
}

class Message {
    type
    data

    constructor(type, data) {
        this.type = type;
        this.data = data;
    }

    static from(json) {
        return Object.assign(new Message(), json);
    }
}

const initP2PServer = p2pPort => {
    const server = new WebSocket.Server({ port: p2pPort });
    server.on('connection', ws => {
        initConnection(ws);
    });
    console.log('App is listening P2P port on: ' + p2pPort);
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


const initConnection = ws => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
}

const JSONToObject = (data) => {
    return JSON.parse(data);
}

const initMessageHandler = ws => {
    ws.on('message', data => {
        const message = Message.from(data);

        if (message === undefined) {
            console.log('Unable to parse JSON message: ' + data);
            return;
        }

        console.log('Received message: ' + JSON.stringify(message));

        switch (message.type) {
            case MessageTypeEnum.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageTypeEnum.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageTypeEnum.RESPONSE_BLOCKCHAIN:
                const receiveBlocks = JSONToObject(message.data);
                if (receiveBlocks === null) {
                    console.log('Invalid blocks received: ');
                    console.log(message.data);
                    break;
                }

                handleBlockchainResponse(receivedBlocks);
                break;
            case MessageTypeEnum.QUERY_TRANSACTION_POOL:
                write(ws, responseTransactionPoolMsg());
                break;
            case MessageTypeEnum.RESPONSE_TRANSACTION_POOL:
                // TODO: Fix this cast 
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
    })
}

const write = (ws, message) => ws.send(JSON.stringify(message));

const broadcast = (message) => sockets.forEach(socket => write(socket, message));

//TODO: Change to new Message();
const queryChainLengthMsg = () => {
    let data = {
        'type': MessageTypeEnum.QUERY_LATEST,
        'data': null
    }

    return Message.from(data);
}

const queryAllMsg = () => {
    let data = {
        'type': MessageTypeEnum.QUERY_ALL,
        'data': null
    }

    return Message.from(data);
}

const responseChainMsg = () => {
    let data = {
        'type': MessageTypeEnum.RESPONSE_BLOCKCHAIN,
        'data': JSON.stringify(bc.getBlockchain())
    }
    return Message.from(data);

}

const responseLatestMsg = () => {

    let data = {
        'type': MessageTypeEnum.QUERY_ALL,
        'data': JSON.stringify(bc.getLatestBlock())
    }
    return Message.from(data);

}

const initErrorHandler = ws => {
    const closeConnection = closingWebSocket => {
        console.log('Connection failed to peer: ' + closingWebSocket.url);
        sockets.splice(sockets.indexOf(closingWebSocket), 1);
    }

    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
}

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

    const latestBlockHeld = bc.getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind. We got: '
            + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            if (addBlockToChain(latestBlockReceived)) {
                broadcast(responseLatestMsg());
            }
        } else if (receivedBlocks.length === 1) {
            console.log('We have to query the chain from our peer');
            broadcast(queryAllMsg());
        } else {
            console.log('Received blockchain is longer than current blockchain');
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
    broadcast(responseLatestMsg());
};

const connectToPeers = newPeer => {
    const ws = new WebSocket(newPeer);
    ws.on('open', () => {
        initConnection(ws);
    });
    ws.on('error', () => {
        console.log('connection failed');
    });
};

module.exports = { connectToPeers, broadcastLatest, initP2PServer, getSockets };