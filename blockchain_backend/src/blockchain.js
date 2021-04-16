const CryptoJS = require('crypto-js')
const MILLISECONDS_PER_SEC = 1000;

class Block {
    index;
    hash;
    previousHash;
    timestamp;
    data;

    constructor(index, hash, previousHash, timestamp, data) {
        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
    }
}

const genesisHash = "9100eb27c7ad31ef4456ee5daec500d3a42f21bfadd26a2e57e547d03b4ae392e2a70a1c864bb7764648155a2a15b382"
const genesisBlock = new Block(0, genesisHash, null , 1618415210 ,"first block")

const blockchain = [genesisBlock];

const getBlockchain = () => {
    return blockchain;
}

const calculateHash = (index, previousHash, timestamp, data) => {
    return CryptoJS.SHA384(index + previousHash + timestamp + data).toString();
}

const calculateHashBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
}

const generateNextBlock = (blockData) => {
    let previousBlock = getLatestBlock();
    let nextIndex = previousBlock.index + 1;
    let nextTimestamp = new Date().getTime() / MILLISECONDS_PER_SEC;
    let nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);

    let newBlock = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
    return newBlock;
}

const addBlock = (newBlock) => {
    if (isBlockValid(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
    }
}

const getLatestBlock = () => {
    return blockchain[blockchain.length - 1];
}

const isBlockValid = (newBlock, previousBlock) => {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previousHash');
        return false;
    } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
    }
    return true;
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
    if (isChainValid(newBlocks) && newBlocks.length > getBlockchain().length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        broadcastLatest();
    } else {
        console.log('Received blockchain invalid');
    }
};

const isValidBlockStructure = (block) => {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
};


module.exports = {Block, getBlockchain, isBlockValid, isChainValid, addBlock, generateNextBlock, getLatestBlock, replaceChain, isValidBlockStructure}
