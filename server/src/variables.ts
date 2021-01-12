import TextUtils from "./TextUtils";

export function extractVariables(content: string) {
  const regex = /(\S+)\s*~?=/gm
  let res = TextUtils.matchAll(content, regex)
  const excludeArray = [']', '[', ',', '，', '(', ')', '>']
  res = res.filter((v, i) => {
    const variable = v[1]
    for (let exclude of excludeArray) {
      if (variable.includes(exclude)) {
        return false
      }
    } 
    // 去重，后面的不要了
    if (res.findIndex(v => v[1] == variable) !== i) {
      return false
    }
    return true
  })
  const variables = res.map(v => {
    const lineNumber = TextUtils.getLineNumber(content, v.index)
    let comments = ''
    if (lineNumber > 0) {
      const line = content.split('\n')[lineNumber - 1].trim()
      if (line.startsWith('%')) {
        // 可能有多个 %，都去除掉
        comments = line.replace(/^%+/g, '')
      }
    }
    comments = comments.trim()
    // 如果用 | 隔开，则前面的是注释，后面的是备注
    const splitPosition = comments.indexOf('|')
    let value = comments
    let comment = '-'
    if (splitPosition !== -1) {
      value = comments.slice(0, splitPosition).trim()
      comment = comments.slice(splitPosition + 1).trim()
    }
    // 如果没有注释，需要提供一个位置
    return {
      name: v[1],
      value: value,
      comment: comment,
      range: {
        start: v.index,
        end: v.index + v[1].length
      }
    }
  })
  return variables
}