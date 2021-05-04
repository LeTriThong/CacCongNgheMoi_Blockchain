import React from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import createWallet from '../../assets/create-wallet.png';
import unlockWallet from '../../assets/unlock-wallet.png';
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

            <div className="Home-menu">
                <div className="Home-create-wallet">
                    <div className="Home-menu-image-container">
                        <img className="Home-menu-image" src={createWallet} ></img>
                    </div>
                    <div className="Home-menu-text-container">
                        <div>
                            <label className="Home-menu-title">Create a new wallet</label>
                        </div>
                        <div>
                            <label className="Home-menu-content">Generate and create your own wallet. Receive a public address, enter private key to access</label>
                        </div>
                        <div>
                            <label className="Home-menu-getStarted">Get started &#8594;</label>
                        </div>
                    </div>
                </div>

                <div className="Home-access-wallet">
                    <div className="Home-menu-image-container">
                        <img className="Home-menu-image" src={unlockWallet} ></img>
                    </div>
                    <div className="Home-menu-text-container">
                        <div>
                            <label className="Home-menu-title">Access my wallet</label>
                        </div>
                        <div>
                            <label className="Home-menu-content">Connect to the blockchain using the wallet. Send & receive coins, see transaction history, mining coins</label>
                        </div>
                        <div>
                            <label className="Home-menu-getStarted">Get started &#8594;</label>
                        </div>
                    </div>

                </div>
            </div>


           




        </div>
    )
}

export default Home;
