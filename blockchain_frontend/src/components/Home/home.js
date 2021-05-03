import React from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import spaceman from '../../assets/big-spaceman.png';
import '../../App.css'


const Home = (props) => {
    return (
        <div className="Home">
            <div style={{ flexDirection: 'row', marginBottom: '50px' }}>
                <img className="Home-logo-image" src={logo} alt="logo"></img>
            </div>

            <div className="Home-intro">
                <div className="Home-intro-text">
                    <div>
                        <label className="Home-intro-text-title">MyCoin's Original Wallet</label>
                    </div>
                    <div>
                        <label className="Home-intro-text-content">MyEtherWallet (our friends call us MEW) is a free, client-side interface helping you interact with the Ethereum blockchain. Our easy-to-use, open-source platform allows you to generate wallets, interact with smart contracts, and so much more.</label>
                    </div>
                </div>

                <div className="Home-intro-image">
                    <img className="Home-image-spaceman" src={spaceman} alt="spaceman"></img>
                </div>
            </div>

            <div>

            <div>
                <div>
                    <label>Create a new wallet</label>
                </div>
                <div>
                    <label>Generate and create your own wallet. Receive a public address, enter private key to access</label>
                </div>
                <div>
                    <label>Get started</label>
                </div>
            </div>

            <div>
                <div>
                    <label>Access my wallet</label>
                </div>
                <div>
                    <label>Connect to the blockchain using the wallet</label>
                </div>
                <div>
                    <ul>
                        <li>Send & receive coins</li>
                        <li>Mining coins</li>
                        <li>See transaction history</li>
                    </ul>
                </div>
                <div>
                    <label>Get started</label>
                </div>
            </div>
            </div>


            <div className="A">
                <div className="B">

                </div>

                <div className="C"></div>
            </div>




        </div>
    )
}

export default Home;
