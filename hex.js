/* like for mobx */

function observable(props){
  // 是否是对象
  if(!isObject(props)) {
    throw 'object props must be object'
    return false
  }
  var result = decorate(props)
  return result;
}

function isObject(value) {
  return value !== null && typeof value === 'object'
} 

function decorate(target) {
  var proxy = new Proxy(target, objectProxyTraps)
  for(var key in target) {
    console.log(key,"key")
  }
  return proxy
}

var objectProxyTraps = {
  get: function(target, name) {
    var reaction = globalState.paddingTracking.splice(0)[0]
    if (reaction && reaction.stale == 0) {
      reaction.stale = 1
      target.observers = reaction
    }
    return target[name]
  },
  set: function(target, name, value) {
    var observers = target.observers;
    observers.onInvalidate()
    return target[name] = value
  }
}

function autorun (fn) {
  var result = new Reaction(fn)
  result.onInvalidate()
}

function Reaction(fn){
  this.onInvalidate = fn;
  this.stale = 0;
  globalState.paddingTracking.push(this)
}

var globalState = {
  paddingTracking: []
}

/* eg */
var person = observable({age:12, name: 'aa'})

autorun(function(){
  console.log("测试", person.age)
})

setInterval(function(){
  person.age = 45
},1000)