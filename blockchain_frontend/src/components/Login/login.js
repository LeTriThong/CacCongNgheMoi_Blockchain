import React, { useState } from 'react';
import logo from '../../assets/short-hand-logo-web.png';

import '../../App.css'


const Login = (props) => {

    const [text, setText] = useState("");

    const setupText = (text) => {
        setText(text);
        console.log(text);
    }

    const onLogin = () => {

    }

    return (
        <div className="Home">
            <div style={{ flexDirection: 'row', marginBottom: '50px' }}>
                <img className="Home-logo-image" src={logo} alt="logo"></img>
            </div>


            <div className="Login-container">
                <div >
                    <label className="Login-title">Access my wallet</label>
                </div>
                <div>
                    <label className="Login-info">Enter your private key</label>
                </div>
                <div>
                    <input className="Login-textinput" type="text" onChange={setupText}/>
                </div>
                <div>
                    <button className="Login-confirm" onClick={onLogin}>Sign in</button>
                </div>
            </div>
        </div>
    )
}

export default Login;