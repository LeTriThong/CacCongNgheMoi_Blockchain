const {getLatestBlock, addBlockToChain, replaceChain, getBlockchain } = require('./blockchain');
// const {Block, getBlockchain } = require('./blockchainCore');
// const { getBlockchain, getLatestBlock, addBlockToChain, replaceChain} = require('./blockchainUtil');
const { getTransactionPool } = require('./transactionPool');





module.exports = { connectToPeers, broadcastTransactionPool, broadcastLatest, initP2PServer, getSockets };