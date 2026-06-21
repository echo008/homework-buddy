# Homework Buddy · 智听

> 基于微信小程序 + 微信云开发 + 火山 OCR + 豆包大模型的 AI 自动化听写助手。

[GitHub 仓库](https://github.com/echo008/homework-buddy) · [TRAE AI 创造力大赛报名帖](https://forum.trae.cn/t/topic/33714/1)

---

## 项目简介

**Homework Buddy（智听）** 是一款面向小学生家长的微信小程序，专注解决「每日报听写」的低效痛点。

传统听写模式里，家长每晚要充当 20-30 分钟的"人工报词机"：朗读、计时、批改、整理错题，整个过程枯燥且易出错。Homework Buddy 用 AI 把这一流程完整自动化——拍照即可建词库、标准语音播报、随机抽题、自动批改、错题自动归档，让家长彻底解放，让孩子获得更标准、更稳定的听写训练。

## 核心亮点

| 能力 | 说明 |
|------|------|
| 拍照识字 | 火山引擎 OCR 识别课本/单词表照片，自动提取文字 |
| AI 结构化 | 豆包大模型把杂乱 OCR 文本清洗为「单词-拼音-释义」标准 JSON |
| 智能抽题 | 按单元/课次筛选，Min-Max 区间随机抽取，Fisher-Yates 洗牌防作弊 |
| 标准发音 | 微信同声传译插件 / 大厂 TTS，告别家长发音不准的困扰 |
| 自动批改 | 提交后秒出结果，红笔纠错，自动生成错题本 |
| 班级共享 | 班级码共享词库，老师可布置全班统一听写任务 |

## 技术栈

- **前端：** 原生微信小程序（WXML / WXSS / JS）
- **后端：** 微信云开发（云函数 Node.js 18 + 云数据库 + 云存储）
- **AI / OCR：** 火山引擎 OCR + 豆包大模型（OpenAI SDK 兼容模式）
- **语音：** 微信同声传译插件 TTS

## 项目结构

```
/miniprogram
  /pages
    /index        首页 - 听写配置
    /preset       智能选题 - 按学段/教材/单元自动选择
    /scan         拍照/上传页
    /dictation    听写进行页
    /result       结果批改页
    /profile      我的/历史记录
    /units        单元管理
    /words        单词管理
    /class        班级共享
  /utils
    /audio.js     录音与播放工具
    /batchTts.js  批量 TTS 音频生成
    /cloudApi.js  云函数统一调用
    /constants.js 项目通用常量
    /tts.js       语音播报封装
    /ui.js        通用 UI 交互
  /cloudfunctions
    /login        获取用户 openid
    /parseOcr     OCR 识别 + LLM 结构化清洗
    /getDictationList  随机抽题引擎
    /unitManage   单元管理
    /wordManage   单词管理
    /classManage  班级共享
    /presetManage 预置内容管理
    /logManage    听写记录管理
/docs
  /schemas        云数据库 JSON Schema
  /contest        大赛报名材料
/tests
  Jest 单元测试
```

## 快速开始

1. 克隆仓库
   ```bash
   git clone https://github.com/echo008/homework-buddy.git
   ```
2. 使用微信开发者工具打开 `miniprogram` 目录
3. 开通微信云开发，创建 `words`、`units`、`userLogs` 集合
4. 在云函数中配置火山引擎与豆包大模型的 API Key（环境变量）
5. 上传并部署云函数，即可体验

## 愿景

让每一个孩子都能获得标准发音的听写训练，让每一位家长都能从重复劳动中解放出来。
