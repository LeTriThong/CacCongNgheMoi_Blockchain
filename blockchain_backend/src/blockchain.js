const CryptoJS = require('crypto-js');
const WebSocket = require('ws');

const _ = require('lodash');
// const { Block, blockchain, getBlockchain } = require('./blockchainCore');
// const { broadcastLatest, initP2PServer } = require('./p2p');
const { processTransactions, getCoinbaseTransaction, UnspentTxOut } = require('./transaction');
const { addToTransactionPool, getTransactionPool, updateTransactionPool } = require('./transactionPool');
// const { isHashMatchesDifficulty } = require('./util');
const { getPublicFromWallet, createTransaction, getPrivateFromWallet, getBalance } = require('./wallet');
const MILLISECONDS_PER_SEC = 1000;

class Block {
    index;
    hash;
    previousHash;
    timestamp;
    /** the transaction data of the block */
    data;
    difficulty;
    nonce;

    /**
     * Block constructor
     * @param {number} index the index of the block in the blockchain
     * @param {string} hash the hash of the mining data
     * @param {string} previousHash the hash of the previous block
     * @param {number} timestamp time created
     * @param {Transaction[]} data transaction data
     * @param {number} diff difficulty of the block
     * @param {number} nonce the nonce number used to hash 
     */
    constructor(index, hash, previousHash, timestamp, data, diff, nonce) {
        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.difficulty = diff;
        this.nonce = nonce;
    }
}

/**
 * First transaction ---> coinbase transaction
 */
const genesisTransaction = {
    'txIns': [{ 'signature': '', 'txOutId': '', 'txOutIndex': 0 }],
    'txOuts': [{
        'address': '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
        'amount': 50
    }],
    'id': 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3'
};

// First block
const genesisBlock = new Block(
    0, '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627', '', 1465154705, [genesisTransaction], 0, 0
);

/**
 * The blockchain - main data
 */
var blockchain = [genesisBlock];


const getBlockchain = () => {
    return blockchain;
}

/**
 *  ! the unspent txOut of genesis block is set to unspentTxOuts on startup
 *  */
let unspentTxOuts = processTransactions(blockchain[0].data, [], 0);

/**
 * clone the unspentTxOuts
 * @returns a clone data of unspentTxOuts
 */
const getUnspentTxOuts = () => _.cloneDeep(unspentTxOuts);

/**
* Setter for unspentTxOuts property
* @param {UnspentTxOut[]} newUnspentTxOut 
*/
const setUnspentTxOuts = (newUnspentTxOut) => {
    console.log('Replacing unspentTxouts with: %s', newUnspentTxOut);
    unspentTxOuts = newUnspentTxOut;
}

/**
 * Get the current latest block in the blockchain
 * @returns the latest block in the blockchain
 */
const getLatestBlock = () => {
    console.log("getLatestBlock()");
    return blockchain[blockchain.length - 1];
}

/**
 * Check if the block is valid, then process transaction push the block to the blockchain as
 * long as 
 * @param {Block} newBlock the block will be added 
 * @returns 
 */
const addBlockToChain = (newBlock) => {
    console.log("addBlockToChain()");
    if (isNewBlockValid(newBlock, getLatestBlock())) {
        const returnValue = processTransactions(newBlock.data, getUnspentTxOuts(), newBlock.index);
        if (returnValue === null) {
            return false;
        } else {
            blockchain.push(newBlock);
            setUnspentTxOuts(returnValue);
            updateTransactionPool(unspentTxOuts);
            return true;

        }
    }
    return false;
}

// ! Number of seconds of 1 block will be generated
const BLOCK_GENERATION_INTERVAL_IN_SEC = 10;

// ! Number of blocks that after that number, the difficulty will increase/decrease
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;



/**
 * Get the current difficulty of the blockchain
 * @param {Block[]} aBlockchain 
 * @returns the adjusted difficulty (if necessary)
 */
const getDifficulty = (aBlockchain) => {
    const latestBlock = aBlockchain[blockchain.length - 1];
    if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL == 0 && latestBlock.index != 0) {
        return getAdjustedDifficulty(latestBlock, aBlockchain);
    }
    else {
        return latestBlock.difficulty;
    }
}

/**
 * 
 * @param {Block} latestBlock 
 * @param {Block[]} aBlockchain the blockchain need to check the difficulty
 * @returns 
 */
const getAdjustedDifficulty = (latestBlock, aBlockchain) => {
    let previousAdjustmentBlock = aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    let timeExpected = BLOCK_GENERATION_INTERVAL_IN_SEC * DIFFICULTY_ADJUSTMENT_INTERVAL;
    let timeNeeded = latestBlock.timestamp - previousAdjustmentBlock.timestamp;

    if (timeNeeded < timeExpected / 2) {
        return previousAdjustmentBlock.difficulty + 1;
    }
    else if (timeNeeded > timeExpected * 2) {
        return previousAdjustmentBlock.difficulty - 1;
    }

    return previousAdjustmentBlock.difficulty;
}

const getCurrentTimestamp = () => {
    return Math.round(new Date().getTime() / MILLISECONDS_PER_SEC);
}

/**
 * Generate a new block that matches difficulties required
 * @param {Transaction[]} blockData 
 * @returns a new block that matches difficulties required
 */
const generateRawNextBlock = (blockData) => {
    const previousBlock = getLatestBlock();
    const difficulty = getDifficulty(getBlockchain());
    const nextIndex = previousBlock.index + 1;
    const nextTimestamp = getCurrentTimestamp();
    const newBlock = findBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty);
    if (addBlockToChain(newBlock)) {
        broadcastLatest();
        return newBlock;
    } else {
        return null;
    }

}

const generateNextBlock = () => {
    const coinbaseTx = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1);
    const blockData = [coinbaseTx].concat(getTransactionPool());
    return generateRawNextBlock(blockData);
}


/**
 * 
 * @returns the unspent transaction outputs owned by the wallet (using public key)
 */
const getMyUnspentTransactionOutputs = () => {
    return findUnspentTxOuts(getPublicFromWallet(), getUnspentTxOuts());
};

/**
 * Create a block with transaction in it
 * @param {string} receiverAddress 
 * @param {number} amount 
 * @returns a raw block with transaction
 */
const generateNextBlockWithTransaction = (receiverAddress, amount) => {
    if (!isValidAddress(receiverAddress)) {
        throw Error('Invalid address');
    }
    if (typeof amount !== 'number') {
        throw Error('Invalid amount');
    }
    const coinbaseTx = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1);
    const transaction = createTransaction(receiverAddress, amount, getPrivateFromWallet(), getUnspentTxOuts(), getTransactionPool());
    const blockData = [coinbaseTx, transaction];
    return generateRawNextBlock(blockData);
};

const findBlock = (index, previousHash, timestamp, data, diff) => {
    let nonce = 0;
    while (true) {
        console.log("Mining block: Nonce =  " + nonce);
        const hash = calculateHash(index, previousHash, timestamp, data, diff, nonce);
        if (isHashMatchesDifficulty(hash, diff)) {
            console.log("Legit");
            console.log("Hash: " + hash);
            const newBlock = new Block(index, hash, previousHash, timestamp, data, diff, nonce);
            console.log("new block created: " + JSON.stringify(newBlock));
            return newBlock;
        }
        nonce++;
    }
}

const getAccountBalance = () => {
    return getBalance(getPublicFromWallet(), getUnspentTxOuts());
};

/**
 * Send the transaction so that everyone knows the transaction
 * has been added to the transaction pool
 * @param {string} address the public key of the receiver 
 * @param {number} amount the amount of coin
 * @returns 
 */
const sendTransaction = (address, amount) => {
    const newTransaction = createTransaction(address, amount, getPrivateFromWallet(), getUnspentTxOuts(), getTransactionPool());
    addToTransactionPool(newTransaction, getUnspentTxOuts());
    broadcastTransactionPool();
    return newTransaction;
}

const calculateHash = (index, previousHash, timestamp, data, diff, nonce) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data + diff + nonce).toString();
}

const calculateHashBlock = (block) => {
    // console.log("block.index: " + block.index);
    // console.log("block.previousHash: " + block.previousHash);
    // console.log("block.timestamp: " + block.timestamp);
    // console.log("JSON.stringify(block.data): " + JSON.stringify(block.data));
    // console.log("block.diff: " + block.diff);
    // console.log("block.nonce: " + block.nonce);
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);
}




/**
 * Check valid structure of the block
 * @param {Block} block 
 * @returns true if all conditions met
 */
const isBlockHasValidStructure = (block) => {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'object';
};

/**
 * Check if new Block is valid
 * @param {Block} newBlock 
 * @param {Block} previousBlock 
 * @returns true if all conditions met
 */
const isNewBlockValid = (newBlock, previousBlock) => {
    console.log("newBlock = " + JSON.stringify(newBlock));

    if (!isBlockHasValidStructure(newBlock)) {
        console.log("New block: Invalid structure, newBlock = " + JSON.stringify(newBlock));
        return false;
    }
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('New block: Invalid index, newBlock = ' + JSON.stringify(newBlock));
        return false;
    }
    else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('New block: Invalid previousHash, newBlock = ' + JSON.stringify(newBlock));
        return false;
    }
    else if (!isValidTimestamp(newBlock, previousBlock)) {
        console.log('New block: Invalid timestamp, newBlock = ' + JSON.stringify(newBlock));
        return false;
    }
    else if (!isBlockHasValidHash(newBlock)) {
        console.log('New block: Invalid hash, newBlock = ' + JSON.stringify(newBlock));
        return false;
    }
    return true;
};

/**
 * Get accumulated difficulty of a chain
 * @param {Block[]} blockchain 
 * @returns the accumulated diffiulty
 */
const getBlockchainAccumulatedDifficulty = (blockchain) => {
    let accumulated = 0
    for (let i = 0; i < blockchain.length; i++) {
        accumulated = accumulated + Math.pow(2, blockchain[i].difficulty);
    }

    return accumulated;
}


/**
 * Timestamp valid when it's 1 minute since last block added
 * @param {Block} newBlock 
 * @param {Block} prevBlock 
 * @returns 
 */
const isValidTimestamp = (newBlock, prevBlock) => {
    return prevBlock.timestamp - 60 < newBlock.timestamp &&
        newBlock.timestamp - 60 < getCurrentTimestamp();
}

const isBlockHasValidHash = (block) => {
    if (!isHashMatchesBlockContent(block)) {
        console.log("Invalid hash");
        return false;
    }

    if (!isHashMatchesDifficulty(block.hash, block.difficulty)) {
        console.log("Block difficulty invalid. Expected: " + block.difficulty + ", actual: " + block.hash);
        return false;
    }

    return true;
}

const isHashMatchesBlockContent = (block) => {
    console.log("CalculateHashBlock()");
    console.log("Block = " + JSON.stringify(block));
    console.log("calculateHashBlock(block) = " + calculateHashBlock(block));
    console.log("Block.hash = " + block.hash);
    return calculateHashBlock(block) === block.hash;
}

const isHashMatchesDifficulty = (hashString, difficulty) => {
    const binaryHash = hexToBin(hashString);
    const prefix = '0'.repeat(difficulty);

    return binaryHash.startsWith(prefix);
};

const hexToBin = (s) => {
    let ret = '';
    const lookupTable = {
        '0': '0000', '1': '0001', '2': '0010', '3': '0011', '4': '0100',
        '5': '0101', '6': '0110', '7': '0111', '8': '1000', '9': '1001',
        'a': '1010', 'b': '1011', 'c': '1100', 'd': '1101',
        'e': '1110', 'f': '1111'
    };
    for (let i = 0; i < s.length; i = i + 1) {
        if (lookupTable[s[i]]) {
            ret += lookupTable[s[i]];
        } else {
            return null;
        }
    }
    return ret;
};



/**
 * Check if the blockchain is valid
 * @param {Block[]} blockchainToValidate the blockchain 
 * @returns the unspentTxOuts if the chain is valid, null if not
 */
const isChainValid = (blockchainToValidate) => {
    const isGenesisValid = (block) => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };

    if (!isGenesisValid(blockchainToValidate[0])) {
        return false;
    }


    for (let i = 1; i < blockchainToValidate.length; i++) {
        if (!isNewBlockValid(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return false;
        }
    }
    return true;
};

/**
 * Replace the current blockchain with a new one with higher accumulate difficulty
 * @param {Block[]} newBlocks 
 */
const replaceChain = (newBlocks) => {
    const aUnspentTxOuts = isChainValid(newBlocks);

    if (aUnspentTxOuts !== null &&
        getBlockchainAccumulatedDifficulty(newBlocks) > getBlockchainAccumulatedDifficulty(getBlockchain())) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        setUnspentTxOuts(aUnspentTxOuts);
        updateTransactionPool(unspentTxOuts);
        broadcastLatest();
    } else {
        console.log('Received blockchain invalid');
    }
};

const handleReceivedTransaction = (transaction) => {
    addToTransactionPool(transaction, getUnspentTxOuts());
}

console.log("Blockchain.js");
console.log(getBlockchain());

//************************************************************************************************************** */

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
    console.log("p2p port = " + p2pPort);
    
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
                    const receiveBlocks = JSONToObject(message.data);

                    if (receiveBlocks === null) {
                        console.log('Invalid blocks received: ');
                        console.log(message.data);
                        break;
                    }

                    // let receiveBlocks = [];
                    // receiveBlocks.forEach((block) => {
                    //     let newBlock = 
                    //     receiveBlocks.push(newBlock);
                    // })

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
    console.log("a = ")
    let a = getBlockchain();
    console.log("a = " + a);
    // console.log("Blockchain = " + JSON.stringify(getBlockchain()));

    let data = {
        'type': MessageTypeEnum.QUERY_ALL,
        'data': JSON.stringify([getLatestBlock()])
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

module.exports = {
    getBlockchain, isNewBlockValid, isChainValid, addBlockToChain, generateNextBlock, getLatestBlock, replaceChain, isBlockHasValidStructure,
    generateRawNextBlock, handleReceivedTransaction, sendTransaction, getAccountBalance, generateNextBlockWithTransaction, getUnspentTxOuts, getMyUnspentTransactionOutputs,
    connectToPeers, broadcastTransactionPool, broadcastLatest, initP2PServer, getSockets
}
