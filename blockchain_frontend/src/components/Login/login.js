import React, { useEffect, useState } from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import spaceman from '../../assets/big-spaceman.png';
import { useHistory } from "react-router-dom";


import '../../App.css'
import axios from 'axios';
import Swal from 'sweetalert2';


const Login = (props) => {
    const SERVER_ENDPOINT = "http://localhost:" + process.env.REACT_APP_HTTP_PORT;

    const history = useHistory();
    const [privateKey, setPrivateKey] = useState("");
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
        console.log(privateKey);
        console.log(privateKey.length);
        // if (privateKey.length === 1) {
            // history.push(`/information`);
        // }
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
                    text: "Incorrect private key"
                })
            }
        }).catch (e => {
            Swal.fire({
                icon: 'error',
                text: "Something went wrong"
            })
        })
        console.log(privateKey);

        console.log("OK");
    }

    return (

        <div className="Home">
            <div style={{ flexDirection: 'row', marginBottom: '50px' }}>
                <img className="Home-logo-image" src={logo} alt="logo"></img>
            </div>

            <div className="Home-intro">
                <div className="Login-container">
                    <div >
                        <label className="Login-title">Access my wallet</label>
                        {/* <label className="Login-title">{privateKey}</label> */}

                    </div>
                    <div>
                        <label className="Login-info">Enter your private key</label>
                    </div>
                    <div>
                        <textarea className="Login-textinput" value={privateKey} type="text" onChange={(e) => setup(e.target.value)} />
                    </div>
                    <div>
                        <button className="Login-confirm" onClick={onLogin}>Sign in</button>
                    </div>
                </div>
                <div className="Home-intro-image">
                    <img className="Home-image-spaceman" src={spaceman} alt="spaceman"></img>
                </div>
            </div>

        </div>

    )
}

export default Login;