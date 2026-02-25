#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node update_config.txt <new_config_file>');
  process.exit(1);
}

const newConfigFile = process.argv[2];
const configFile = path.join(__dirname, 'config.js');

console.log('📋 更新config.js，配置文件:', newConfigFile);

try {
  const newConfigData = fs.readFileSync(newConfigFile, 'utf8');
  const newConfig = JSON.parse(newConfigData);
  const shopId = Object.keys(newConfig)[0];
  const shopConfig = newConfig[shopId];

  console.log(`商家ID: ${shopId}`);
  console.log('商家名称:', shopConfig.name);
  console.log('菜品数量:', shopConfig.dishes?.length || 0);

  let content = fs.readFileSync(configFile, 'utf8');
  const newShopConfigStr = `    "${shopId}": ${JSON.stringify(shopConfig, null, 4)}`;

  // 检查是否已存在该商家
  if (content.includes(`"${shopId}":`)) {
    console.log(`🔄 更新现有商家: ${shopId}`);
    const pattern = new RegExp(
      `"${shopId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:\\s*\\{[\\s\\S]*?\\n\\s*\\}`,
      'm'
    );
    content = content.replace(pattern, newShopConfigStr);
  } else {
    console.log(`➕ 添加新商家: ${shopId}`);

    // 定义标记（必须与 config.js 中的完全一致）
    const startMarker = '// ---------- 商家配置开始标记 ----------';
    const endMarker = '// ---------- 商家配置结束标记 ----------';

    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);

    if (startIdx === -1 || endIdx === -1) {
      throw new Error('未找到配置标记，请确保config.js中包含开始和结束标记');
    }

    // 将内容按行分割
    const lines = content.split('\n');
    
    // 找到结束标记所在的行号
    let endLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(endMarker)) {
        endLineIndex = i;
        break;
      }
    }
    if (endLineIndex === -1) throw new Error('无法定位结束标记行');

    // 获取结束标记的上一行（即对象定义的最后一行，应该是 `};` 或 `}`）
    const prevLine = lines[endLineIndex - 1].trim();
    
    // 判断上一行是否需要逗号
    let needComma = true;
    if (prevLine.endsWith(',')) {
      needComma = false; // 如果已经有逗号，不再添加
    } else if (prevLine.endsWith('{') || prevLine.endsWith('}') || prevLine.endsWith('};')) {
      needComma = false; // 如果是空对象或对象结束，不加逗号
    }

    // 构建要插入的字符串
    const insertStr = needComma ? ',\n' + newShopConfigStr : '\n' + newShopConfigStr;

    // 在结束标记行的上一行之后插入新内容
    const beforeEndLine = lines.slice(0, endLineIndex).join('\n');
    const afterEndLine = lines.slice(endLineIndex).join('\n');
    
    // 重新组合内容：beforeEndLine 已经包含上一行，所以直接插入 insertStr 后接 afterEndLine
    content = beforeEndLine + insertStr + '\n' + afterEndLine;
  }

  fs.writeFileSync(configFile, content);
  console.log('✅ config.js更新成功！');

} catch (error) {
  console.error('❌ 更新失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
