const CryptoJS = require('crypto-js');
const { broadcastLatest, initP2PServer } = require('./p2p');
const { processTransactions } = require('./transaction');
const { getPublicFromWallet } = require('./wallet');
const MILLISECONDS_PER_SEC = 1000;

class Block {
    index;
    hash;
    previousHash;
    timestamp;
    data;
    difficulty;
    nonce;

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

// First block
const genesisHash = "9100eb27c7ad31ef4456ee5daec500d3a42f21bfadd26a2e57e547d03b4ae392e2a70a1c864bb7764648155a2a15b382"
const genesisBlock = new Block(0, genesisHash, null, 1618415210, "first block", 0, 0)

// ! Number of seconds of 1 block will be generated
const BLOCK_GENERATION_INTERVAL_IN_SEC = 10;

// ! Number of blocks that after that number, the difficulty will increase/decrease
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

let blockchain = [genesisBlock];


let unspentTxOuts = [];

const getBlockchain = () => {
    return blockchain;
}

const getLatestBlock = () => {
    return blockchain[blockchain.length - 1];
}

const getDifficulty = (attemptedBlockchain) => {
    const latestBlock = attemptedBlockchain[blockchain.length - 1];
    if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL == 0 && latestBlock.index != 0) {
        return getAdjustedDifficulty(latestBlock, attemptedBlockchain);
    }
    else {
        return latestBlock.difficulty;
    }
}

const getAdjustedDifficulty = (latestBlock, attemptedBlockchain) => {
    let previousAdjustmentBlock = attemptedBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
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
 * 
 * @param {Transaction[]} blockData 
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

const generateNextBlock = (blockData) => {
    let previousBlock = getLatestBlock();
    let diff = getDifficulty(getBlockchain());
    console.log('difficulty: ' + diff);
    let nextIndex = previousBlock.index + 1;
    let nextTimestamp = getCurrentTimestamp();

    let newBlock = findBlock(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
    addBlockToChain(newBlock);
    broadcastLatest();
    return newBlock;
}

const generatenextBlockWithTransaction = (receiverAddress, amount) => {
    if (!isValidAddress(receiverAddress)) {
        throw Error('invalid address');
    }
    if (typeof amount !== 'number') {
        throw Error('invalid amount');
    }
    const coinbaseTx = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1);
    const tx = createTransaction(receiverAddress, amount, getPrivateFromWallet(), unspentTxOuts);
    const blockData = [coinbaseTx, tx];
    return generateRawNextBlock(blockData);
};

const findBlock = (index, previousHash, timestamp, data, diff) => {
    let nonce = 0;
    while (true) {
        const hash = calculateHash(index, previousHash, timestamp, data, diff, nonce);
        if (isHashMatchesDifficulty(hash, diff)) {
            return new Block(index, hash, previousHash, timestamp, data, diff, nonce);
        }
        nonce++;
    }
}

const getAccountBalance = () => {
    return getBalance(getPublicFromWallet(), unspentTxOuts);
};

const calculateHash = (index, previousHash, timestamp, data, diff, nonce) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data + diff + nonce).toString();
}

const calculateHashBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
}



const addBlockToChain = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        const retVal = processTransactions(newBlock.data, unspentTxOuts, newBlock.index);
        if (retVal === null) {
            return false;
        } else {
            blockchain.push(newBlock);
            unspentTxOuts = retVal;
            return true;

        }
    }
    return false;
}

const isValidBlockStructure = (block) => {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
};


const isBlockValid = (newBlock, previousBlock) => {
    if (!isValidBlockStructure(newBlock)) {
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
        return false;

    }
    return true;
};

const getAccumulatedDifficulty = (attemptedBlockchain) => {
    let accumulated = 0
    for (let i = 0; i < attemptedBlockchain.length; i++) {
        accumulated = accumulated + Math.pow(2, attemptedBlockchain[i].difficulty);
    }

    return accumulated;
}



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
    return calculateHashForBlock(block) === block.hash;
}

const isHashMatchesDifficulty = (hashString, difficulty) => {
    const binaryHash = hexToBin(hashString);
    const prefix = '0'.repeat(difficulty);

    return binaryHash.startsWith(prefix);
};

const isChainValid = (blockchainToValidate) => {
    const isGenesisValid = (block) => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };

    if (!isGenesisValid(blockchainToValidate[0])) {
        return false;
    }

    for (let i = 1; i < blockchainToValidate.length; i++) {
        if (!isBlockValid(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return false;
        }
    }
    return true;
};


const replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) &&
        getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlockchain())) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        broadcastLatest();
    } else {
        console.log('Received blockchain invalid');
    }
};



module.exports = { Block, getBlockchain, isBlockValid, isChainValid, addBlockToChain, generateNextBlock, getLatestBlock, replaceChain, isValidBlockStructure }
