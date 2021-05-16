import React, { useEffect, useState } from 'react';


import '../../App.css'



const TransactionInfo = (props) => {
    const [blockNumber, setBlockNumber] = useState("ID");
    const [time, setTime] = useState("TO");
   


    return (
        <div className="Transaction-info-container">
            <div>
                <label class="Transaction-info-title">ID</label>
                <label class="Transaction-info-content">{props.blockInfo.index}</label>
            </div>
            <div>
                <label class="Transaction-info-title">From</label>
                <label class="Transaction-info-content">{props.blockInfo.timestamp}</label>
            </div>

        </div>
    )
}

export default TransactionInfo;