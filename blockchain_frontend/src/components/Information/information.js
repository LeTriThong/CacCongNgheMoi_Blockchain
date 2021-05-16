import React, { useEffect, useState } from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import account from '../../assets/account.svg';
import network from '../../assets/network.svg';
import wallet from '../../assets/wallet.svg';
import Axios from 'axios'
import Swal from 'sweetalert2'

import '../../App.css'
import { io } from "socket.io-client"
import { Link } from 'react-router-dom';
// const ENDPOINT = "http://localhost:" + process.env.REACT_APP_P2P_PORT;
const SERVER_ENDPOINT = "http://localhost:" + process.env.REACT_APP_HTTP_PORT;
const SUPER_NODE_ENDPOINT = "http://localhost:" + process.env.REACT_APP_SUPER_NODE_PORT;
const UI_SOCKET_ENDPOINT = "http://localhost:" + process.env.REACT_APP_UI_SOCKET_PORT;


const Information = (props) => {
    console.log("abcdefg", props.location.privateKey);
    // const [privateKey, setPrivateKey] = useState("asdada");
    const [address, setAddress] = useState("public key");
    const [coin, setCoin] = useState(-5);
    const [transactionPool, setTransactionPool] = useState([]);
    const [blockchain, setBlockchain] = useState([]);


    const [transactionAddress, setTransactionAddress] = useState("");
    const [transactionCoin, setTransactionCoin] = useState(0);

    // const setup = (t) => {
    //     setPrivateKey(t);
    //     console.log(t);
    // }

    useEffect(() => {
        const getPeerFromSuperNode = async () => {
            await Axios.get(SUPER_NODE_ENDPOINT + '/peers')
                .then(res => {
                    if (res.status === 200) {
                        console.log("Connecting to peers")
                        console.log(res.data);
                        // setP2pAddress(res.data);
                        console.log(res.data.length);
                        for (let i = 0; i < res.data.length; ++i) {
                            addPeer(res.data[i]);
                        }
                    }
                    else {
                        console.log("Fail to connect to peers");
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        }

        const UIMessageTypeEnum = {
            ADD_BLOCK_TO_CHAIN: 0,
            UPDATE_TRANSACTION_POOL: 1,
            UPDATE_BALANCE: 2
        }

        // const socket = io(ENDPOINT);
        // console.log("abcde")

        // socket.emit('yasuo', "alo");

        // socket.on('message', data => {
        //     console.log(data);

        //     switch (data.type) {

        //     }
        // })

        const newSocket = io(UI_SOCKET_ENDPOINT);
        newSocket.on('message', data => {
            console.log(data);
            // setSocket(socket.push(data));
            // setBlockchain(blockchain.push(data))
            let message = JSON.parse(data);
            console.log("Message: " + message);
            switch (message.type) {
                case UIMessageTypeEnum.ADD_BLOCK_TO_CHAIN:
                    getBlockchain();
                    getBalance();
                    break;
                case UIMessageTypeEnum.UPDATE_TRANSACTION_POOL:
                    getTransactionPool();
                    break;
                case UIMessageTypeEnum.UPDATE_BALANCE:
                    getBalance();
                    break;
                default:
                    console.log("Wrong UI message type")
            }

            // getBlockchain();

        })

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
        const init = async () => {
            await addPeer(SUPER_NODE_ENDPOINT);
            await getPeerFromSuperNode();
            // console.log(p2pAddress.length);
            // for(let i = 0; i < p2pAddress.length; ++i) {
            //     addPeer(p2pAddress[i]);
            // }
            // await p2pAddress.foreach(element => {
            // addPeer(element);
            // });

            await getBalance();
            await getAddress();
            await getTransactionPool();
            await getBlockchain();
            // await getPeer();
            // await addPeer();

        }

        init();
    }, [])



    const addPeer = async (endpoint) => {
        if (endpoint === SERVER_ENDPOINT) {
            console.log("Duplicate")
            return;
        }

        await Axios.post(endpoint + '/addPeer', {
            peer: process.env.REACT_APP_P2P_PORT,
            httpPort: process.env.REACT_APP_HTTP_PORT
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

    // const getPeer = async () => {
    //     await Axios.get(SERVER_ENDPOINT + '/peers')
    //         .then(res => {
    //             if (res.status === 200) {
    //                 console.log("Connecting to peers")
    //                 console.log(res.data);
    //                 setP2pAddress(res.data);
    //                 console.log(res.data.length);
    //                 for (let i = 0; i < res.data.length; ++i) {
    //                     addPeer(res.data[i]);
    //                 }
    //             }
    //             else {
    //                 console.log("Fail to connect to peers");
    //             }
    //         })
    //         .catch(error => {
    //             console.log(error);
    //         });
    // }



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
                    Swal.fire({
                        icon: 'error',
                        text: 'Unable to mine',
                        showConfirmButton: false,
                        timer: 1500
                    })
                }
                else if (res.status === 200) {
                    // console.log("Success");
                    getBlockchain();
                    getBalance();
                    getTransactionPool();

                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        text: 'Mine success',
                        showConfirmButton: false,
                        timer: 1500
                    })
                }
            })
    }

    const handleTransactionAddress = (e) => {
        setTransactionAddress(e);

    }

    const handleTransactionCoin = (e) => {
        setTransactionCoin(e)
    }

    const onSendTransaction = async () => {
        console.log("Address = " + transactionAddress);
        console.log("Amount = " + transactionCoin)
        await Axios.post(SERVER_ENDPOINT + '/sendTransaction', {
            "address": transactionAddress,
            "amount": parseFloat(transactionCoin)
        })
            .then(res => {
                if (res.status === 200) {
                    console.log(res.data);

                    Swal.fire({
                        icon: 'success',
                        text: 'Transaction has been sent to transaction pool',
                        showConfirmButton: false,
                        timer: 1500
                    })
                }
                else {
                    console.log(res.data);
                    Swal.fire({
                        icon: 'error',
                        text: res.data
                    })
                }
            })
    }

    const onLogout = async() => {
        await Axios.get(SERVER_ENDPOINT + '/logout')
        .then(res => {
            console.log("Disconnect successfully");
        });
    }

    // const onLogin = () => {
    //     // setTextLength(textLength + 1);
    //     // console.log(textLength)
    // }

    return (

        <div className="Home">
            <div style={{ display:'flex', flexDirection: 'row', marginBottom: '50px', justifyContent: 'space-between' }}>
              
                    <img className="Home-logo-image" src={logo} alt="logo"></img>
           
                <div>
                    <Link to='/'>
                        <div>

                            <label style={{color: '#05C0A5', fontSize: 'large', marginRight: '20px'}} onClick={onLogout}>Log out </label>
                        </div>
                    </Link>
                </div>

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
                                <label className="Info-card-content">{address}</label>
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
                            <input className="Info-send-input" value={transactionCoin} type="number" onChange={(e) => handleTransactionCoin(e.target.value)}></input>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label className="Info-send-title">To address</label>
                            <input className="Info-send-input" value={transactionAddress} onChange={(e) => handleTransactionAddress(e.target.value)}></input>
                        </div>
                        {/* <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label className="Info-send-title">Transaction fee</label>
                            <input className="Info-send-input"></input>
                        </div> */}
                        <div>
                            <button className="Info-send-transaction-confirm" onClick={onSendTransaction}>Send transaction</button>
                            <button className="Info-send-transaction-confirm" onClick={onMineBlock} >Mine block</button>

                        </div>
                    </div>
                    <div style={{ display: 'flex', flex: 1 }}>
                    </div>
                </div>
                <div>
                    <label className="Info-send-title">{address} </label>
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