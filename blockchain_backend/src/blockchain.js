const CryptoJS = require('crypto-js');
const { broadcastLatest, initP2PServer } = require('./p2p');
const { processTransactions, getCoinbaseTransaction, UnspentTxOut } = require('./transaction');
const { addToTransactionPool, getTransactionPool, updateTransactionPool } = require('./transactionPool');
const { getPublicFromWallet, createTransaction, getPrivateFromWallet } = require('./wallet');
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

// First block
//TODO: Change this hash
const genesisHash = "9100eb27c7ad31ef4456ee5daec500d3a42f21bfadd26a2e57e547d03b4ae392e2a70a1c864bb7764648155a2a15b382"

const genesisBlock = new Block(0, genesisHash, '', 1618415210, genesisTransaction, 0, 0);

/**
 * First transaction ---> coinbase transaction
 */
 const genesisTransaction = {
    'txIns': [{'signature': '', 'txOutId': '', 'txOutIndex': 0}],
    'txOuts': [{
        'address': '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
        'amount': 50
    }],
    'id': 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3'
};


// ! Number of seconds of 1 block will be generated
const BLOCK_GENERATION_INTERVAL_IN_SEC = 10;

// ! Number of blocks that after that number, the difficulty will increase/decrease
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

/**
 * The blockchain - main data
 */
let blockchain = [genesisBlock];

const getBlockchain = () => {
    return blockchain;
}

/**
 *  the unspent txOut of genesis block is set to unspentTxOuts on startup
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






const getLatestBlock = () => {
    return blockchain[blockchain.length - 1];
}
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

const generateNextBlock = (blockData) => {
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
const generatenextBlockWithTransaction = (receiverAddress, amount) => {
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
    const newTransaction = createTransaction(address, amount, getPrivateFromWallet());
    addToTransactionPool(newTransaction, getUnspentTxOuts());
    broadcastTransactionPool();
    return newTransaction;
}

const calculateHash = (index, previousHash, timestamp, data, diff, nonce) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data + diff + nonce).toString();
}

const calculateHashBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
}


/**
 * Check if the block is valid, then process transaction push the block to the blockchain as
 * long as 
 * @param {Block} newBlock the block will be added 
 * @returns 
 */
const addBlockToChain = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
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
        && typeof block.data === 'string';
};

/**
 * Check if new Block is valid
 * @param {Block} newBlock 
 * @param {Block} previousBlock 
 * @returns true if all conditions met
 */
const isNewBlockValid = (newBlock, previousBlock) => {
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
    return calculateHashForBlock(block) === block.hash;
}

const isHashMatchesDifficulty = (hashString, difficulty) => {
    const binaryHash = hexToBin(hashString);
    const prefix = '0'.repeat(difficulty);

    return binaryHash.startsWith(prefix);
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
    const aUnspentTxOuts = isValidChain(newBlocks);

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



module.exports = { Block, getBlockchain, isBlockValid: isNewBlockValid, isChainValid, addBlockToChain, generateNextBlock, getLatestBlock, replaceChain, isValidBlockStructure: isBlockHasValidStructure,
generateRawNextBlock, handleReceivedTransaction, sendTransaction, getAccountBalance, generatenextBlockWithTransaction, getUnspentTxOuts, getMyUnspentTransactionOutputs }
