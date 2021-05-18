import React, { useEffect, useState } from 'react';
import logo from '../../assets/short-hand-logo-web.png';
import account from '../../assets/account.svg';
import network from '../../assets/network.svg';
import wallet from '../../assets/wallet.svg';
import Axios from 'axios'
import Swal from 'sweetalert2'

import '../../App.css'



const TransactionInfo = (props) => {
    const [id, setId] = useState("ID");
    const [from, setFrom] = useState("FROM");
    const [to, setTo] = useState("TO");
    const [amount, setAmount] = useState(0);
    
    const setupStatusLabel = () => {
        if (props.txInfo.completeStatus === true) {
            return (
                <label class="Complete-status-true">Completed</label>
            )
        }else {
            return (
                <label class="Complete-status-false">Unconfirmed</label>
            )
        }
    }

    return (
        <div className="Block-info-container">
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <label class="Block-info-title">ID</label>
                <label class="Block-info-content">{props.txInfo.id}</label>
            </div>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <label class="Block-info-title">From</label>
                <label class="Block-info-content">{props.txInfo.sender}</label>
            </div>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <label class="Block-info-title">To</label>
                <label class="Block-info-content">{props.txInfo.receiver}</label>
            </div>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <label class="Block-info-title">Status</label>
                {setupStatusLabel()}
            </div>
        </div>
    )
}

export default TransactionInfo;