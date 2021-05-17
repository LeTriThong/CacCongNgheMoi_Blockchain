import React, { useEffect, useState } from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import spaceman from '../../assets/big-spaceman.png';
import {ec} from 'elliptic';


import '../../App.css'
import axios from 'axios';
import Swal from 'sweetalert2';


const Register = (props) => {
    const SERVER_ENDPOINT = "http://localhost:" + process.env.REACT_APP_HTTP_PORT;

    const [privateKey, setPrivateKey] = useState("Private key here");

    useEffect(() => {
        const EC = new ec('secp256k1');
        const keyPair = EC.genKeyPair();
        setPrivateKey(keyPair.getPrivate().toString());
        
    },[]);




    const directToMain = () => {
        console.log("privateKey = ", privateKey);
        axios.post(SERVER_ENDPOINT + '/initWallet', {
            privateKey: privateKey
        })
        .then((res) => {
            if (res.status === 200) {
                props.history.push('/information');
            }
            else {
                Swal.fire({
                    icon: 'error',
                    text: "Something went wrong"
                })
            }
        })
        .catch(e => {
            Swal.fire({
                icon: 'error',
                text: "Something went wrong"
            })
        })
        console.log(privateKey);
        
    }

    return (
  
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
                            <textarea className="Login-textinput" value={privateKey} type="text"  readOnly/>
                        </div>
                        {/* <Link to={{
                            pathname:'/information',
                            privateKey: privateKey
                        }}> */}
                            <div>
                                <button className="Login-confirm" onClick={directToMain}>Access your wallet</button>
                            </div>
                        {/* </Link> */}
                    </div>
                    <div className="Home-intro-image">
                        <img className="Home-image-spaceman" src={spaceman} alt="spaceman"></img>
                    </div>
                </div>

            </div>
    )
}

export default Register;