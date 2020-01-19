import React, { Component } from 'react'

export default class Dialog extends Component {

  render () {
    return (

      // <div className="dialog-wrapper">
        <div className="dialog -large"
          onClick={this.props.close}
        >
          <h1>click me to close!</h1>
        </div>
      // </div>
    )
  }

  componentDidMount () {
    console.log('dialog', this.props)
  }
}