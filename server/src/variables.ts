import { LogTraceNotification } from 'vscode-languageserver';
import { readContent } from './reader';
import TextUtils from "./TextUtils";

type VariableItem = {
  name: string,
  value: string,
  comment: string,
  range: {
    start: number,
    end: number
  },
  lineNumber: number
}

type FunctionVariable = {
  params: Array<VariableItem>,
  returns: Array<VariableItem>
}

type FunctionLine = {
  lineNumber: number,
  index: number
}

function getFunctionLine(content: string): FunctionLine {
  const functionRegex = /function\s/gm
  const functionRes = TextUtils.matchAll(content, functionRegex)
  if (functionRes.length > 0) {
    return {
      lineNumber: TextUtils.getLineNumber(content, functionRes[0].index),
      index: functionRes[0].index
    }
  } else {
    return {
      lineNumber: -1,
      index: -1
    }
  }
}


export function extractVariables(content: string): Array<VariableItem> {
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
  let variables = res.map(v => {
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
    const item: VariableItem = {
      name: v[1],
      value: value,
      comment: comment,
      range: {
        start: v.index,
        end: v.index + v[1].length
      },
      lineNumber: lineNumber
    }
    return item
  })
  // 过滤掉 function 这一行的
  const functionLineNumber = getFunctionLine(content).lineNumber
  variables = variables.filter(v => v.lineNumber !== functionLineNumber)
  return variables
}

function stringArrayToVariables(params: {
  arr: Array<string>,
  functionLine: FunctionLine,
  line: string
}): Array<VariableItem> {
  const { arr, functionLine, line } = params
  return arr.map(v => {
    const start = functionLine.index + line.indexOf(v)
    return {
      name: v,
      value: '',
      comment: '',
      lineNumber: functionLine.lineNumber,
      range: {
        start: start,
        end: start + v.length
      }
    }
  })
}

/**
 * 提取代码中的 function 变量
 */
export function extractFunctionVariables(content: string): FunctionVariable {
  let res: FunctionVariable = {
    params: [],
    returns: []
  }
  // 首先获取 function 所在行
  const line = content.split('\n').filter(v => v.includes('function '))[0].trim()
  /**
   * 函数参数
   */
  const params = line.split('(')[1].split(')')[0].replace(/\s/g, '').split(',')
  // 参数的位置
  const functionLine = getFunctionLine(content)
  res.params = stringArrayToVariables({
    arr: params,
    functionLine: functionLine,
    line: line
  })
  /**
   * 返回值
   */
  // 多个变量
  const regex = /function\s\[(.+)\]\s/gm
  const multiRes = TextUtils.matchAll(content, regex)
  let returns : Array<string> = []
  if (multiRes.length > 0) {
    returns = multiRes[0][1].replace(/\s/g, '').split(',')
  } else {
    // 单个变量
    const regexSingle = /function\s(\S+)\s=/gm
    const singleRes = regexSingle.exec(content)
    if (singleRes) {
      returns = [singleRes[1]]
    }
  }
  // 给变量增加上属性
  res.returns = stringArrayToVariables({
    arr: returns,
    functionLine: functionLine,
    line: line
  })
  return res
}

const filePath = 'C:\\Users\\sheng\\Documents\\code\\matlab\\quaternion_matlab\\日常行为分析\\feature_visualize\\feature_range_3d\\get_feature_importance.m'
// const filePath = 'C:\\Users\\sheng\\Documents\\code\\matlab\\quaternion_matlab\\nine\\lib\\readData.m'
const content = readContent(filePath)
const res = extractFunctionVariables(content)
console.log(res);
