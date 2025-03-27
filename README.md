一个轻量级的悬浮式 AI 聊天窗口组件实现模板，支持 GPT-4 及其他模型，适用于网页端。

## 功能特性

✅ **悬浮式聊天窗口** - 点击按钮即可打开 AI 聊天窗口，在页面右下角弹出。

✅ **支持流式响应** - 采用流式数据处理，增强用户体验。

✅ **多种 AI 模型** - 可选择 `gpt-3.5-turbo`、`gpt-4o` 等模型。

✅ **自动滚动** - 消息输入后，聊天窗口自动滚动到底部。

✅ **清空对话** - 一键清除聊天记录，开启新会话。

## 安装与使用

### 1. 克隆项目


### 2. 安装依赖
```sh
pnpm install  # 或 npm install / yarn install
```

### 3. 运行开发环境
```sh
pnpm dev  # 或 npm run dev / yarn dev
```

### 4. 集成到你的项目

在你的 React 项目中，导入并使用组件：

```tsx
import AIChatWidget from "@/components/AIChatWidget";

function App() {
  return (
    <div>
      <AIChatWidget />
    </div>
  );
}

export default App;
```


