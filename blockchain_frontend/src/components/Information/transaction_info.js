import React, { useEffect, useState } from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import account from '../../assets/account.svg';
import network from '../../assets/network.svg';
import wallet from '../../assets/wallet.svg';
import Axios from 'axios'
import Swal from 'sweetalert2'
import moduleName from '@material-ui/core/';

import '../../App.css'



const TransactionInfo = (props) => {
    const [id, setId] = useState("ID");
    const [from, setFrom] = useState("FROM");
    const [to, setTo] = useState("TO");
    const [amount, setAmount] = useState(0);
    useEffect(() => {
        const setup = () => {
            let publicKey = props.publicKey;

            setId(props.txInfo.id);
            
            
                
            props.txInfo.txOuts[0].forEach(element => {
                if (element.address !== publicKey) {
                    setTo(element.address)
                    setAmount(amount + element.amount)
                }
            });



        }
    }, [])


    return (
        <div className="Transaction-info-container">
            <div>
                <label class="Transaction-info-title">ID</label>
                <label class="Transaction-info-content">{id}</label>
            </div>
            <div>
                <label class="Transaction-info-title">From</label>
                <label class="Transaction-info-content">{from}</label>
            </div>
            <div>
                <label class="Transaction-info-title">To</label>
                <label class="Transaction-info-content">{to}</label>
            </div>
            <div>
                <label class="Transaction-info-title">Amount</label>
                <label class="Transaction-info-content">{amount}</label>
            </div>

        </div>
    )
}

export default TransactionInfo;