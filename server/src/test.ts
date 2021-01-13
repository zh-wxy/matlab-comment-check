import { readContent } from './reader'
import { extractVariables } from './variables'

const filePath = 'C:\\Users\\ZH\\Desktop\\code\\new\\matlab2C\\antiShakeSimple.m'
const content = readContent(filePath)
const variables = extractVariables(content)
console.log(variables);
