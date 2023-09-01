import React from 'react'

const NodeLabel = (props) => {
    const { nodeData } = props
    return (
        <div>
            {nodeData.date} 
            <span style={{paddingLeft: '5px', color: 'gray', fontSize: '10px'}}>{nodeData.week}</span>
        </div>
    )
}

export default NodeLabel