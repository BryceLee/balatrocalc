# Balatro Calculator

## 项目简介
一个用于计算 Balatro 手牌分数的在线工具，支持小丑牌、卡牌增强、手牌类型等各种组合的分数计算。

## 技术栈
- 纯前端项目（HTML + CSS + JavaScript）
- 使用像素风格的 UI 设计
- Web Workers 用于复杂计算优化

## 文件结构
```
/
├── index.html          # 主页面
├── style.css          # 样式文件
├── assets/            # 资源文件夹
│   ├── favicon.svg    # 网站图标
│   ├── chips.png      # 筹码图标
│   ├── Jokers.png     # 小丑牌贴图
│   ├── Editions.png   # 版本贴图
│   └── Enhancers.png  # 增强器贴图
├── *.js              # JavaScript 逻辑文件
│   ├── main.js       # 主逻辑
│   ├── cards.js      # 卡牌逻辑
│   ├── breakdown.js  # 分数分解
│   └── ...
```

## 开发命令
由于是纯前端项目，直接在浏览器中打开 index.html 即可运行。

建议使用本地服务器：
```bash
# 使用 Python 启动本地服务器
python -m http.server 8000

# 或使用 Node.js
npx http-server
```

## 功能特性
- ✅ 小丑牌计算器
- ✅ 卡牌增强效果
- ✅ 手牌类型识别
- ✅ 实时分数计算
- ✅ 优化算法（可选）

## 常见任务
- **修改样式**: 编辑 `style.css`
- **添加功能**: 修改对应的 `.js` 文件
- **更新资源**: 替换 `assets/` 目录中的文件
- **调试**: 使用浏览器开发者工具

## 注意事项
- 图片资源使用像素完美渲染 (`image-rendering: pixelated`)
- 支持响应式设计，适配移动端
- 使用 Web Workers 进行复杂计算以避免 UI 阻塞
- 小丑牌源代码地址：~/SoloProduct/game/Balatro_source