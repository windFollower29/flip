// TODO: 在动画冲突时，如何处理（快速操作场景）

import React, { Component } from 'react'
import ReactDOM from 'react-dom'

function getArrayChildren (children) {
  return React.Children.toArray(children)
}

function cloneChildWithRefs (child) {
  return React.cloneElement(child, { ref: child.key })
}

function getPlaceholderRect (node) {
  let { offsetLeft: x, offsetTop: y } = node
  while (
    node.parentNode &&
    node.parentNode.tagName.toLocaleLowerCase() != 'html'
  ) {
    x += node.parentNode.offsetLeft
    y += node.parentNode.offsetTop
    node = node.parentNode
  }
  return { x, y }
}

function getPositionFromParent (node) {
  if (!node.parentElement) return {}
  node = node.parentElement
  if (
    node.style.position != 'static' ||
    node.tagName.toLowserCase() == 'body'
  ) {
    return node.getBoundingClientRect()
  } else {
    return getPositionFromParent(node)
  }
}

let localFlag = false

export default class Flipper extends Component {

  cacheRectData = {}

  state = {
    cloneChildren: []
    // getArrayChildren(this.props.children).map(node => cloneChildWithRefs(node))
  }

  render () {
    let { cloneChildren } = this.state
    let children = cloneChildren.map(node => cloneChildWithRefs(node))

    return (
      <React.Fragment>
        { children }
      </React.Fragment>
    )
  }

  doAnimation () {
    let first = this.props.firstRect
    console.log('doAnimation')
    this.state.cloneChildren.forEach(node => {
      // first render && no animationIn demand
      if (!first) return;

      const dom = ReactDOM.findDOMNode(this.refs[node.key])
      const last = dom.getBoundingClientRect()
      // console.log(first, last)
      const diffX = first.x - last.x
      const diffY = first.y - last.y

      // no change
      if (!diffX && !diffY) return;
  
      const task = dom.animate(
        [
          {
            // opacity: 0,
            transform: `translate(${diffX}px, ${diffY}px)`
          },
          {
            // opacity: 1,
            transform: `translate(0, 0)`
          }
        ],
        {
          duration: +this.props.duration,
          easing: 'ease'
        }
      )

      task.onfinish = () => {
  
      }

    })

  }

  getChildren (nextChildren, curChildren) {
    let children = []

    if (nextChildren.length < curChildren.length) {
      // 有删除元素
      curChildren.forEach(child => {
        const idx = nextChildren.findIndex(node => node.key === child.key)

        if (idx > -1) {
          children.push(cloneChildWithRefs(nextChildren[idx]))
        } else {
          children.push(cloneChildWithRefs(child))
        }
      })
    } else {
      children = nextChildren.map(child => cloneChildWithRefs(child))
    }

    return children
  }

  cacheRect () {
    // console.log('cacheRect')

    this.state.cloneChildren.forEach(node => {

      // if (children[node.key].toleave) return;
      this.cacheRectData[node.key] = ReactDOM.findDOMNode(this.refs[node.key]).getBoundingClientRect()

      // this.cacheNode[node.key] = this.cacheRectData[node.key]
    })

    console.log(Object.keys(this.cacheRectData).map(key => key + '/' + this.cacheRectData[key].x))

  }

  componentDidMount () {
    // console.log('componentDidMount')
    window.$$0 = this

    const cloneChildren = getArrayChildren(this.props.children)
    this.setState({ cloneChildren })
  }

  playFlip (dom, diffX, diffY, opacity = [1, 1], finishCb = function () {}) {
    
    const task = dom.animate(
      [
        {
          transform: `
            translate(${diffX}px, ${diffY}px)
          `,
          opacity: opacity[0]
        },
        {
          transform: `
            translate(0, 0)
          `,
          opacity: opacity[1]
        }
      ],
      {
        duration: +this.props.duration,
        easing: 'ease'
      }
    )

    task.onfinish = finishCb

    return task
  }

  // 设置新增元素的过场动画
  flipEnterNode (dom) {
    const { firstRect } = this.props
    if (firstRect) {
      const { x, y } = dom.getBoundingClientRect()
      this.playFlip(dom, firstRect.x - x, firstRect.y - y, [0, 1])
      return
    }
    this.playFlip(dom, 50, 10, [0, 1])
    // this.doAnimation()
  }

  // 设置删除元素的过场动画
  flipLeaveNode (dom, node) {
    const { x, y } = this.cacheRectData[node.key]
    const last = dom.getBoundingClientRect()

    let _cloneChldren = [ ...this.state.cloneChildren ]
    const _idx = _cloneChldren.findIndex(child => child.key == node.key)
    const _child = React.cloneElement(_cloneChldren[_idx], { animating: true })
    _cloneChldren.splice(_idx, 1, _child)

    this.setState({ cloneChildren: _cloneChldren })
    
    this.playFlip(
      dom,
      x - last.x,
      // y - last.y,
      0,
      [1, 0],
      () => {
        // console.log(this.state.cloneChildren)
        const idx = this.state.cloneChildren.findIndex(child => node.key == child.key)
        const children = this.state.cloneChildren.splice(idx, 1)
        // 解决方案二选一：动画结束后删除元素，避免在componentDidUpdate中走一遍动画，因为这时不会触发cacheData，位置信息会出错
        // localFlag = true
        // this.cacheRect()
        this.setState({ children })
      }
    )
  }

  // 设置移动元素的过场动画
  flipMoveNode (dom, first, node) {
    
    // const last = dom.getBoundingClientRect()
    const { x, y } = dom.getBoundingClientRect()
    const last = getPlaceholderRect(dom)
    const dx = x - last.x
    // 当做增加操作时，为什么取first.y，不取y？因为增加item会影响y轴方向（btw：x轴的first位置才因此这么处理）。在快速操作下，第二个新增时，第一个新增的item位置会突变，动画也突变
    const dy = first.y - last.y

    // if (node.key == '.$65088') {
    //   console.log(x, first.x, '---', last.y, first.y)
    // }

    if (!dx && !dy) return;

    this.playFlip(dom, dx, dy)
  }

  componentDidUpdate (prevProps) {
    console.log('componentDidUpdate', prevProps.children)

    this.state.cloneChildren.forEach(node => {

      const dom = ReactDOM.findDOMNode(this.refs[node.key])
      const first = this.cacheRectData[node.key]

      if (node.props.toleave) {

        if (!node.props.animating) {
          // 开始离场动画/正在离场动画ing
          // console.log('leave元素')
          this.flipLeaveNode(dom, node)
        }

      } else if (first) {
        console.log('move元素')
        // console.log(first.x)
        this.flipMoveNode(dom, first, node)
        
      } else {
        console.log('enter元素')
        this.flipEnterNode(dom)
      }
    })

  }

  componentWillReceiveProps (nextProps) {
    // console.log('componentWillReceiveProps')

    // 预设：每次进来，只能+1/-1/换位
    let children = []
    const nextChildren = getArrayChildren(nextProps.children)
    const curChildren = getArrayChildren(this.props.children)
    const action = nextChildren.length - curChildren.length
    
    // 更新state.cloneChildren
    if (action > 0) {
      console.log('新增元素')
      children = [ ...this.state.cloneChildren ]
      for (let i = 0; i < nextChildren.length; i++) {
        const node = nextChildren[i]
        const idx = children.findIndex(child => child.key == node.key)

        if (idx < 0) {
          // 新增的
          if (i == 0){
            i = 1
          }
          const nextNodeKey = nextChildren[i - 1].key
          const index = children.findIndex(c => c.key == nextNodeKey)
          // console.log(i - 1, index, nextChildren.length, children.length)
          children.splice(index + 1, 0, cloneChildWithRefs(node))

          break;
        }
      }

    } else if (action == 0) {
      console.log('改变位置')
      // TODO: 更新顺序。应该使用this.state.cloneChildren，因为删除元素时children不同步
      children = nextChildren.map(child => cloneChildWithRefs(child))

      // let _children = [ ...(this.state.cloneChildren.length ? this.state.cloneChildren : nextProps.children) ]
      // for (let i = 0; i < nextChildren.length; i++) {
      //   const nextKey = nextChildren[i].key
      //   const curKey = curChildren[i].key
      //   const i = _children.findIndex(c => c.key == nextKey)
      //   const j = _children.findIndex(c => c.key == curKey)
      //   if (
      //     nextKey != curKey &&
      //     i > -1 &&
      //     j > -1
      //   ) {
      //     // const tmp = _children[i]
      //     // _children[i] = _children[j]
      //     // _children[j] = tmp
      //     [_children[i], _children[j]] = [_children[j], _children[i]]
      //     break;
      //   }
      // }

      // children = _children
      
    } else {
      console.log('删除元素')
      
      for (let child of curChildren) {

        const idx = nextChildren.findIndex(nextChild => nextChild.key == child.key)
        if (idx < 0) {

          const i = this.state.cloneChildren.findIndex(node => node.key == child.key)

          let cloneChild = this.state.cloneChildren[i]
          const dom = ReactDOM.findDOMNode(this.refs[cloneChild.key])
          // console.log(cloneChild)
          // cloneChild.toleave = true
          // 把删除元素从文本流中脱离
          const first = dom.getBoundingClientRect()
          // 缓存开始删除前的位置信息
          this.cacheRectData[cloneChild.key] = first
          const { x, y } = getPositionFromParent(dom)
          this.state.cloneChildren[i] = React.cloneElement(cloneChild, {
            toleave: true,
            style: {
              // position: 'relative',
              position: 'absolute',
              top: `${first.y - y}px`,
              left: `${first.x - x + 50}px`,
              margin: 0
            }
          })
          console.log('remove', first.x, x, first.y, y)
          break;
        }
      }
      children = this.state.cloneChildren
    }

    // 缓存换位的元素的位置信息
    // this.cacheRect()

    this.setState({ cloneChildren: children })

  }

  componentWillUpdate () {
    // state和props更新时都会触发
    // 缓存换位的元素的位置信息
    this.cacheRect()
  }
  
}
