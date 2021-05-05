import React, { useEffect, useState } from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import spaceman from '../../assets/big-spaceman.png';


import '../../App.css'


const Login = (props) => {
    console.log("abcd")
    const [privateKey, setPrivateKey] = useState("asdada");

    // const setupText = (t) => {
    //     console.log(t);
    //     setText(t.target.value);

    //     console.log(text);
    //     // console.log(textLength);
    //     // console.log(1);
    // }

    const setup = (t) => {
        setPrivateKey(t);
        console.log(t);
    }

    useEffect(() => {

    }, [])

    const onLogin = () => {
        // setTextLength(textLength + 1);
        // console.log(textLength)
    }

    return (

        <div className="Home">
            <div style={{ flexDirection: 'row', marginBottom: '50px' }}>
                <img className="Home-logo-image" src={logo} alt="logo"></img>
            </div>

            <div>
                <div className="Info-card-container">
                    <div className="Info-card-address">
                        <div className="Info-card-image">

                        </div>
                        <div className="Info-card-text">
                            <div className="Info-card-title">

                            </div>
                            <div className="Info-card-content">

                            </div>
                        </div>

                    </div>
                    <div className="Info-card-balance">
                        <div className="Info-card-image">

                        </div>
                        <div className="Info-card-text">
                            <div className="Info-card-title">

                            </div>
                            <div className="Info-card-content">

                            </div>
                        </div>

                    </div>
                    <div className="Info-card-network">
                        <div className="Info-card-image">

                        </div>
                        <div className="Info-card-text">
                            <div className="Info-card-title">

                            </div>
                            <div className="Info-card-content">

                            </div>
                        </div>

                    </div>
                </div>

                <div>
                    <div>
                        <label className="Info-send-transaction">Send transaction</label>
                    </div>
                    <div>
                        <label className="Info-send-title">Amount</label>
                        <input className="Info-send-input" type="number"></input>
                        <label className="Info-send-title">To address</label>
                        <input className="Info-send-input"></input>
                        <label className="Info-send-title">Transaction fee</label>
                        <input className="Info-send-input"></input>
                    </div>
                    <div>
                        <button className="Info-send-transaction-confirm">Send transaction</button>
                    </div>

                </div>
            </div>



        </div>

    )
}

export default Login;