import React, { useEffect, useState } from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import spaceman from '../../assets/big-spaceman.png';
import {ec} from 'elliptic';


import '../../App.css'


const Register = (props) => {
    const [privateKey, setPrivateKey] = useState("asdada");

    useEffect(() => {
        const EC = new ec('secp256k1');
        const keyPair = EC.genKeyPair();
        setPrivateKey(keyPair.getPrivate());
    },[]);




    const directToMain = () => {
        
    }

    return (
        <form>
            <div className="Home">
                <div style={{ flexDirection: 'row', marginBottom: '50px' }}>
                    <img className="Home-logo-image" src={logo} alt="logo"></img>
                </div>
                <div className="Home-intro">
                    <div className="Login-container">
                        <div >
                            <label className="Login-title">Register my wallet</label>
                        </div>
                        <div>
                            <label className="Login-info">Copy this private key, this is your access to the wallet</label>
                            <label className="Login-info">Keep this carefully beacuse this cannot be retrieved</label>
                        </div>
                        <div>
                            <input className="Login-textinput" value={privateKey} type="text" 
                            maxLength={32} readOnly />
                        </div>
                        <div>
                            <button className="Login-confirm" onClick={directToMain}>Access your wallet</button>
                        </div>
                    </div>
                    <div className="Home-intro-image">
                        <img className="Home-image-spaceman" src={spaceman} alt="spaceman"></img>
                    </div>
                </div>

            </div>
        </form>
    )
}

export default Register;