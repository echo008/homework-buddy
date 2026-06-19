// utils/tts.js - 语音播报封装
// 优先使用微信同声传译插件（WechatSI）进行 TTS；未配置插件时给出友好降级

let plugin = null
try {
  plugin = requirePlugin('WechatSI')
} catch (err) {
  console.warn('同声传译插件未配置:', err)
}

const FALLBACK_LANG = 'zh_CN'

// 当前正在播放的 TTS 音频上下文（单例，便于外部停止）
let currentTtsAudio = null

/**
 * 停止当前 TTS 播放
 */
function stop() {
  if (currentTtsAudio) {
    try {
      currentTtsAudio.stop()
    } catch (e) {}
    try {
      currentTtsAudio.destroy()
    } catch (e) {}
    currentTtsAudio = null
  }
}

/**
 * 播报文本
 * @param {string} text 需要播报的内容
 * @param {string} lang 语言：zh_CN / en_US
 * @param {Object} callbacks 生命周期回调 { onStart, onEnd, onError }
 * @returns {Object} 控制句柄 { stop }
 */
function speak(text, lang = FALLBACK_LANG, callbacks = {}) {
  if (!text || !text.trim()) {
    return { stop }
  }

  const content = text.trim()

  // 播报前先停止上一个 TTS
  stop()

  if (plugin && typeof plugin.textToSpeech === 'function') {
    plugin.textToSpeech({
      lang,
      tts: true,
      content,
      success(res) {
        playAudio(res.filename, callbacks)
      },
      fail(err) {
        console.error('TTS 合成失败:', err)
        fallbackSpeak(content, lang, callbacks)
      }
    })
  } else {
    fallbackSpeak(content, lang, callbacks)
  }

  return { stop }
}

function playAudio(src, callbacks) {
  const innerAudioContext = wx.createInnerAudioContext()
  innerAudioContext.src = src
  currentTtsAudio = innerAudioContext

  innerAudioContext.onPlay(() => {
    if (typeof callbacks.onStart === 'function') callbacks.onStart()
  })

  innerAudioContext.onEnded(() => {
    if (typeof callbacks.onEnd === 'function') callbacks.onEnd()
    innerAudioContext.destroy()
    if (currentTtsAudio === innerAudioContext) currentTtsAudio = null
  })

  innerAudioContext.onError((err) => {
    console.error('音频播放失败:', err)
    if (typeof callbacks.onError === 'function') callbacks.onError(err)
    innerAudioContext.destroy()
    if (currentTtsAudio === innerAudioContext) currentTtsAudio = null
  })

  innerAudioContext.play()
}

/**
 * 降级播报：插件不可用时，使用系统提示音 + Toast 提示用户当前为文字模式
 */
function fallbackSpeak(content, lang, callbacks) {
  if (typeof callbacks.onError === 'function') {
    callbacks.onError({ errMsg: '当前环境未启用同声传译插件，已切换为文字显示模式' })
  }
  // 通过短震动提示用户
  if (wx.vibrateShort) {
    wx.vibrateShort({ type: 'light' })
  }
}

/**
 * 根据学科/题目类型推断 TTS 语言
 * @param {string} promptType english | chinese | pinyin
 * @param {string} subject english | chinese
 */
function resolveLang(promptType, subject) {
  if (promptType === 'english' || (subject === 'english' && promptType !== 'chinese')) {
    return 'en_US'
  }
  return 'zh_CN'
}

module.exports = {
  speak,
  stop,
  resolveLang
}
