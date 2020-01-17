import React, { Component } from 'react'

import Flipper from './Flipper'
import Dialog from './Dialog'

import './style.scss'

const style = {
  dialog: {
    transition: 'all 5.5s cubic-bezier(0.6, 0.04, 0.98, 0.335)'
  }
}

let backup = ['👬','😱','😓','😻','🙅‍♂️','😔','😄','😊','❌','1️⃣','👴']

export default class App extends Component {

  state = {
    showDialog: false,
    firstRect: {},
    emojis: ['😯', '😈', '🙂', '🇨🇳', '🔟', '😍', '🤤', '👌', '🏓', '🏃‍♀️']
  }

  render () {
    const {
      firstRect,
      emojis
    } = this.state

    return (
      <div>
        <button
          ref={el => this.btnRef = el}
          onClick={this.onClick}
        >open dialog</button>

        {
          // this.state.showDialog
          //   ? (
          //     <div className="dialog-wrapper">
          //       <Flipper
          //         duration={1000}
          //         firstRect={firstRect}
          //       >
          //         <Dialog
          //           key="dialog"
          //           close={this.close.bind(this)}
          //         />
          //       </Flipper>
          //     </div>
          //   )
          //   : null
        }

        <ul className="emoji-list">
          <Flipper
            duration={3000}
            // firstRect={firstRect}
          >
            {
              emojis.map((emoji, idx) => (
                  <li
                    key={emoji.charCodeAt(0) + emoji.charCodeAt(1)}
                    val={emoji}
                  >
                    <div className="body">
                      <div className="title">{emoji}</div>
                      <span>{idx}</span>
                      <div className="tools">
                        <span className="add"
                          onClick={this.add.bind(this, emoji)}
                        >+</span>
                        <span className="remove"
                          onClick={this.remove.bind(this, emoji)}
                        >-</span>
                        <span className="up"
                          onClick={this.doUp.bind(this, emoji)}
                        >↑</span>
                      </div>
                    </div>
                  </li>
              ))
            }
          </Flipper>
        </ul>
        
      </div>
    )
  }

  close () {
    this.setState({ showDialog: false })
  }

  onClick = () => {
    // console.log('onClick')
    this.setState({ showDialog: true })
  }

  doUp (emoji) {
    const list = [ ...this.state.emojis ]
    const idx = list.findIndex(item => item == emoji)

    if (!idx) return;

    list.splice(idx - 1, 2, list[idx], list[idx - 1])

    this.setState({ emojis: list })
  }

  remove (emoji) {
    // console.log('remove')
    const list = [ ...this.state.emojis ]
    list.splice(list.findIndex(item => item == emoji), 1)

    this.setState({ emojis: list })
  }

  add (emoji) {
    const list = [ ...this.state.emojis ]
    const e = backup.shift()
    if (!e) return;
    
    const idx = list.indexOf(emoji)
    e && list.splice(idx + 1, 0, e)
    this.setState({ emojis: list })
  }

  componentWillMount () {
    this.btnRef = null
  }

  componentDidMount () {
    this.setState({ firstRect: this.btnRef.getBoundingClientRect() })

    document.body.addEventListener('click', () => {

    }, false)
  }
}

// React.render(
//   <App />,
//   document
// )