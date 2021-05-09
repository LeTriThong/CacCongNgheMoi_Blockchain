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


const Information = (props) => {
    console.log("abcd")
    // const [privateKey, setPrivateKey] = useState("asdada");
    const [address, setAddress] = useState("qwer");
    const [coin, setCoin] = useState(-5);

    // const setup = (t) => {
    //     setPrivateKey(t);
    //     console.log(t);
    // }

    useEffect(() => {
        const socket = io(ENDPOINT);
        console.log("abcde")
        socket.on('yasuo', text => {
            console.log(text);
            setAddress(text);
        });
        socket.emit('yasuo', "alo");


        Axios.get(SERVER_ENDPOINT + '/balance')
            .then((response) => {
                // console.log(JSON.stringify(response))
                setCoin(response.data.balance);
            })
            .catch(error => {
                console.log(error);
            });

        


    }, [])



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
                                <label className="Info-card-title">{address}</label>
                            </div>
                            <div className="Info-card-content">
                                <label className="Info-card-content">88888888888888888888888888888888</label>
                            </div>
                            <div className="Info-card-content">
                                <label className="Info-card-content">88888888888888888888888888888888</label>
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
                                <label className="Info-card-content">Current block: #12345678</label>

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
                        </div>
                    </div>
                    <div style={{ display: 'flex', flex: 1 }}>

                    </div>

                </div>
            </div>



        </div>

    )
}

export default Information;