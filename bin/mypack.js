#! /usr/bin/env node
let entry = './src/index.js' // 入口文件
let output = './dist/index.js' //出口
let fs = require('fs')
let script = fs.readFileSync(entry, 'utf8')
let ejs = require('ejs')
let path = require('path')
let modules = [] // 依赖模块
let styleLoader = function(source) {
  // source代表的是样式文件中的内容
  return `
    let style = document.createElement('style')
    style.innerText = ${JSON.stringify(source).replace(/\\r\\n/g, '')}
    document.head.appendChild(style)
  `
}
// 处理依赖关系
script = script.replace(/require\(['"](.+?)['"]\)/g, function() {
  let name = path.join('./src', arguments[1])
  let content = fs.readFileSync(name, 'utf8')
  if(/\.css$/.test(name)) {
    content = styleLoader(content)
  }
  modules.push({
    name, content
  })
  return `require('${name}')`
})

let template = `
  (function (modules) {
    function require(moduleId) {
      var module = {
        exports: {}
      }
      modules[moduleId].call(module.exports, module, module.exports, require)
      return module.exports
    }
    return require('<%-entry%>')
  })({
    '<%-entry%>':
    (function (module, exports, require) {
      eval(\`<%-script%>\`)
    })
    <%for(let i = 0; i < modules.length; i++) {
      let module = modules[i]%>,
      '<%-module.name%>':
      (function (module, exports, require) {
        eval(\`<%-module.content%>\`)
      })
    <%}%>
  })
`
let result = ejs.render(template, {
  entry,
  script,
  modules
})
// result为替换后的结果， 最终要写到output中
fs.writeFileSync(output, result)
console.log('+++打包成功+++')