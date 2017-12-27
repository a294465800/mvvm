! function () {

  /**
   * 观察
   * @param {Object} data 
   */
  function Observe(data) {
    if (!data || typeof data !== 'object') return

    for (let key in data) {

      let subject = new Subject()
      let val = data[key]
      Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get: function () {
          console.log(`get ${key}: ${val}`)
          if (currentObserver) {
            currentObserver.subscribeTo(subject)
          }
          return val
        },
        set: function (newVal) {
          val = newVal
          subject.notify()
        }
      })

      if (typeof val === 'object') {
        Observe(val)
      }
    }
  }

  /**
   * 主题
   */
  let id = 0
  class Subject {
    constructor() {
      this.id = ++id
      this.observers = []
    }

    /**
     * 新增观察者
     * @param {Object} observer 
     */
    addObserver(observer) {
      var index = this.observers.indexOf(observer)
      this.observers.push(observer)
    }

    /**
     * 移除观察者
     * @param {Object} observer 
     */
    removeObserver(observer) {
      var index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }

    /**
     * 通知观察者更新数据
     */
    notify() {
      console.log(this)
      this.observers.forEach(observer => {
        observer.update()
      })
    }
  }

  let currentObserver
  class Observer {
    constructor(vm, key, cb) {
      this.subjects = {}
      this.vm = vm
      this.key = key
      this.cb = cb
      this.value = this.getValue()
    }

    /**
     * 获取最新 data，触发 set ，假若当前主题没有订阅，订阅
     */
    getValue() {
      currentObserver = this
      let val = this.vm.$data[this.key]
      currentObserver = undefined
      return val
    }

    /**
     * 更新数据
     */
    update() {
      let oldVal = this.value
      let value = this.getValue()
      if (value !== oldVal) {
        this.value = value
        this.cb.apply(this.vm, [value, oldVal])
      }
    }

    /**
     * 订阅
     * @param {Object} subject 
     */
    subscribeTo(subject) {
      if (!this.subjects[subject.id]) {
        console.log('subscribeTo.. ', subject)
        subject.addObserver(this)
        this.subjects[subject.id] = subject
      }
    }
  }

  class Mvvm {
    constructor(options) {
      this.init(options)
      Observe(this.$data)
      this.compile()
    }

    /**
     * 初始化
     * @param {Object} options 
     */
    init(options) {
      this.$el = document.querySelector(options.el)
      this.$data = options.data
      this.observers = []
    }

    compile() {
      this.traverse(this.$el)
    }

    /**
     * 循环 el 节点，渲染 text 文本
     * @param {Object} node 
     */
    traverse(node) {
      if (node.nodeType === 1) {
        node.childNodes.forEach(child => {
          this.traverse(child)
        })
      } else if (node.nodeType === 3) { //文本节点
        this.renderText(node)
      }
    }

    /**
     * 渲染文本
     * @param {Object} node 
     */
    renderText(node) {
      let re = /{{(.+?)}}/g
      let match = re.exec(node.nodeValue)
      while (match) {
        let val = match[0]
        let key = match[1].trim()
        node.nodeValue = node.nodeValue.replace(val, this.$data[key])
        new Observer(this, key, (newVal, oldVal) => {
          node.nodeValue = node.nodeValue.replace(oldVal, newVal)
        })
        match = re.exec(node.nodeValue)
      }
    }
  }

  let vm = new Mvvm({
    el: '#app',
    data: {
      title: '这是测试',
      time: new Date()
    }
  })

  setInterval(() => {
    vm.$data.time = new Date()
  }, 1000)

  document.querySelector('#edit').addEventListener('click', function (e) {
    vm.$data.title = document.querySelector('#titleInput').value
  })

}()