// utils/audio.js - 录音与播放工具

const recorderManager = wx.getRecorderManager()

let recordResolve = null
let recordReject = null

recorderManager.onStop((res) => {
  if (recordResolve) recordResolve(res)
})

recorderManager.onError((err) => {
  if (recordReject) recordReject(err)
})

/**
 * 开始录音（最长 10 秒，mp3 格式）
 */
function startRecord() {
  return new Promise((resolve, reject) => {
    recordResolve = resolve
    recordReject = reject
    wx.authorize({
      scope: 'scope.record',
      success() {
        recorderManager.start({
          duration: 10000,
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          format: 'mp3'
        })
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

/**
 * 停止录音并返回临时文件路径
 */
function stopRecord() {
  return new Promise((resolve, reject) => {
    recordResolve = resolve
    recordReject = reject
    recorderManager.stop()
  })
}

/**
 * 上传录音到云存储
 */
async function uploadAudio(tempFilePath, folder = 'audio') {
  const ext = tempFilePath.split('.').pop() || 'mp3'
  const cloudPath = `${folder}/${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`
  const { fileID } = await wx.cloud.uploadFile({
    cloudPath,
    filePath: tempFilePath
  })
  return fileID
}

// 当前正在播放的音频上下文（单例，避免连续点击叠加播放）
let currentPlayContext = null

/**
 * 停止当前播放
 */
function stopPlay() {
  if (currentPlayContext) {
    try {
      currentPlayContext.stop()
    } catch (e) {}
    try {
      currentPlayContext.destroy()
    } catch (e) {}
    currentPlayContext = null
  }
}

/**
 * 播放音频（支持云存储 fileID）
 * 单例管理：播放新音频前自动停止上一个，避免叠加
 */
async function playAudio(src) {
  // 播放前先停止上一个
  stopPlay()

  let url = src
  if (src && src.startsWith('cloud://')) {
    try {
      const { fileList } = await wx.cloud.getTempFileURL({ fileList: [src] })
      if (fileList && fileList[0] && fileList[0].tempFileURL) {
        url = fileList[0].tempFileURL
      }
    } catch (err) {
      console.error('获取云文件临时链接失败:', err)
    }
  }

  const innerAudioContext = wx.createInnerAudioContext()
  currentPlayContext = innerAudioContext
  innerAudioContext.src = url
  innerAudioContext.onEnded(() => {
    innerAudioContext.destroy()
    if (currentPlayContext === innerAudioContext) currentPlayContext = null
  })
  innerAudioContext.onError((err) => {
    console.error('播放失败:', err)
    innerAudioContext.destroy()
    if (currentPlayContext === innerAudioContext) currentPlayContext = null
  })
  innerAudioContext.play()
}

module.exports = {
  startRecord,
  stopRecord,
  uploadAudio,
  playAudio,
  stopPlay
}
