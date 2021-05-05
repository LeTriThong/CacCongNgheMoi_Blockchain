import React, { useEffect, useState } from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import spaceman from '../../assets/big-spaceman.png';


import '../../App.css'


const Login = (props) => {
    console.log("abcd")
    const [privateKey, setPrivateKey] = useState("asdada");
    const [textLength, setTextLength] = useState(0);

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
        <form>
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
                            <input className="Login-textinput" value={privateKey} type="text" maxLength={32} onChange={(e) => setup(e.target.value)} />
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
        </form>
    )
}

export default Login;