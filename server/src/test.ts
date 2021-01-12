import { readContent } from './reader'
import { extractVariables } from './variables'

const filePath = 'C:\\Users\\sheng\\Documents\\code\\matlab\\quaternion_matlab\\日常行为分析\\feature_visualize\\feature_range_test.m'
const content = readContent(filePath)
const variables = extractVariables(content)
console.log(variables)