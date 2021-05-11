import React, { useEffect, useState } from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import account from '../../assets/account.svg';
import network from '../../assets/network.svg';
import wallet from '../../assets/wallet.svg';
import Axios from 'axios'

import '../../App.css'
import { io } from "socket.io-client"
const ENDPOINT = "http://localhost:6001"
const SERVER_ENDPOINT = "http://localhost:3001"
const SUPER_NODE_ENDPOINT = "http://localhost:3001"


const Information = (props) => {
    const MessageTypeEnum = {
        QUERY_LATEST: 0,
        QUERY_ALL: 1,
        RESPONSE_BLOCKCHAIN: 2,
        QUERY_TRANSACTION_POOL: 3,
        RESPONSE_TRANSACTION_POOL: 4
    }


    console.log("abcd")
    // const [privateKey, setPrivateKey] = useState("asdada");
    const [address, setAddress] = useState("public key");
    const [coin, setCoin] = useState(-5);
    const [transactionPool, setTransactionPool] = useState([]);
    const [blockchain, setBlockchain] = useState([]);

    // const setup = (t) => {
    //     setPrivateKey(t);
    //     console.log(t);
    // }

    useEffect(() => {
        // const socket = io(ENDPOINT);
        // console.log("abcde")

        // socket.emit('yasuo', "alo");

        // socket.on('message', data => {
        //     console.log(data);

        //     switch (data.type) {

        //     }
        // })

        
        init();



        // console.log()

        // Axios.post(SERVER_ENDPOINT + '/addPeer', {
        //     peer: 3001
        // })
        // .then(res => {
        //     if (res.status === 200) {
        //         console.log("Add peer")
        //         console.log(res.data);
        //     }
        //     else {
        //         console.log("Fail to add peers");
        //     }
        // })
        // .catch(error => {
        //     console.log(error);
        // });
        



    }, [])

    const init = async () => {
        await getBalance();
        await getAddress();
        await getTransactionPool();
        await getBlockchain();
        await getPeer();
        await addPeer();
        
    }

    const addPeer = async () => {
        if (SERVER_ENDPOINT === SUPER_NODE_ENDPOINT) {
            console.log("Duplicate")
            return;
        }

        await Axios.post(SUPER_NODE_ENDPOINT + '/addPeer', {
            peer: 6001
        })
        .then(res => {
            if (res.status === 200) {
                console.log("Add peer")
                console.log(res.data);
            }
            else {
                console.log("Fail to add peers");
            }
        })
        .catch(error => {
            console.log(error);
        });
    }
    

    const getTransactionPool = async () => {
        Axios.get(SERVER_ENDPOINT + '/transactionPool')
            .then(response => {
                console.log("Get transaction pool");

                setTransactionPool(response.data);
            })
            .catch(error => {
                console.log(error);
            });
    }

    const getAddress = async () => {
        Axios.get(SERVER_ENDPOINT + '/address')
            .then(response => {
                console.log("Get address");
                setAddress(response.data.address);
            })
            .catch(error => {
                console.log(error);
            });
    }

    const getPeer = async () => {
        await Axios.get(SERVER_ENDPOINT + '/peers')
        .then(res => {
            if (res.status === 200) {
                console.log("Connecting to peers")
                console.log(res.data);
            }
            else {
                console.log("Fail to connect to peers");
            }
        })
        .catch(error => {
            console.log(error);
        });
    }

    const getBlockchain = async () => {
        await Axios.get(SERVER_ENDPOINT + '/blocks')
        .then(response => {
            console.log("Get blockchain");
            console.log(response);

            // setTransactionPool(response.data);
            setBlockchain(response.data.reverse());
        })
        .catch(error => {
            console.log(error);
        });
    }

    const getBalance = async () => {
        Axios.get(SERVER_ENDPOINT + '/balance')
        .then((response) => {
            // console.log(JSON.stringify(response))
            console.log("Get balance");
            setCoin(response.data.balance);
        })
        .catch(error => {
            console.log(error);
        });
    }


    const onMineBlock = async () => {
        await Axios.post(SERVER_ENDPOINT + '/mineBlock')
        .then(res => {
            if (res.status === 400) {
                console.log("Faillllllllllll");
            }
            else if (res.status === 200) {
                // console.log("Success");
                getBlockchain();
                getBalance();
            }
        })
    }

    // const onLogin = () => {
    //     // setTextLength(textLength + 1);
    //     // console.log(textLength)
    // }

    return (

        <div className="Home">
            <div style={{ flexDirection: 'row', marginBottom: '50px' }}>
                <img className="Home-logo-image" src={logo} alt="logo"></img>
            </div>

            <div>
                <div className="Info-card-container">
                    <div className="Info-card-address">
                        <div className="Info-card-image">
                            <img className="Info-image" src={account} alt="" />
                        </div>
                        <div className="Info-card-text">
                            <div className="Info-card-title">
                                <label className="Info-card-title">Address</label>
                            </div>
                            <div className="Info-card-content">
                                <label className="Info-card-content">{address.substring(0, 32)}</label>
                            </div>
                            <div className="Info-card-content">
                                <label className="Info-card-content">{address.substring(32, 64)}</label>
                            </div>
                        </div>

                    </div>
                    <div className="Info-card-balance">
                        <div className="Info-card-image">
                            <img className="Info-image" src={wallet} alt="" />

                        </div>
                        <div className="Info-card-text">
                            <div className="Info-card-title">
                                <label className="Info-card-title">Balance</label>

                            </div>
                            <div className="Info-card-content">
                                <label className="Info-card-content">{coin} MC</label>

                            </div>
                        </div>

                    </div>
                    <div className="Info-card-network">
                        <div className="Info-card-image">
                            <img className="Info-image" src={network} alt="" />

                        </div>
                        <div className="Info-card-text">
                            <div className="Info-card-title">
                                <label className="Info-card-title">Network</label>

                            </div>
                            <div className="Info-card-content">
                                <label className="Info-card-content">Current block: #{blockchain.length}</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="Info-send-transaction-container">
                    <label className="Info-send-transaction">Send transaction</label>
                </div>
                <div style={{ display: 'flex' }}>
                    <div style={{ display: 'flex', flex: 2, flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label className="Info-send-title">Amount</label>
                            <input className="Info-send-input" type="number"></input>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label className="Info-send-title">To address</label>
                            <input className="Info-send-input"></input>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label className="Info-send-title">Transaction fee</label>
                            <input className="Info-send-input"></input>
                        </div>
                        <div>
                            <button className="Info-send-transaction-confirm">Send transaction</button>
                            <button className="Info-send-transaction-confirm" onClick={onMineBlock} >Mine block</button>

                        </div>
                    </div>
                    <div style={{ display: 'flex', flex: 1 }}>


                    </div>

                </div>
                <div>
                    <label className="Info-send-title">Transaction pool: </label>

                    <label className="Info-send-title">{transactionPool.length}</label>

                    <label className="Info-send-title">{JSON.stringify(transactionPool)}</label>
                </div>
                <div>
                    <label className="Info-send-title">blockchain: </label>

                    <label className="Info-send-title">{blockchain.length}</label>

                    <label className="Info-send-title">{JSON.stringify(blockchain)}</label>

                </div>
            </div>



        </div>

    )
}

export default Information;