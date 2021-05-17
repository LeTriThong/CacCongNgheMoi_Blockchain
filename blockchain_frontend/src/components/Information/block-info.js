import React from 'react';


import '../../App.css'



const BlockInfo = (props) => {

   

    const setNumber = () => {
        var date = new Date(props.blockInfo.timestamp * 1000);
      
        
        // Will display time in 10:30:23 format
        return date.toLocaleString();
        // return t;
    }

    return (
        <div className="Block-info-container">
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <label class="Block-info-title">ID</label>
                <label class="Block-info-content">{props.blockInfo.index}</label>
            </div>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <label class="Block-info-title">From</label>
                <label class="Block-info-content">{setNumber()}</label>
            </div>

        </div>
    )
}

export default BlockInfo;