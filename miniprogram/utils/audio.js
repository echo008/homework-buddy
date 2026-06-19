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

/**
 * 播放音频（支持云存储 fileID）
 */
async function playAudio(src) {
  let url = src
  if (src && src.startsWith('cloud://')) {
    const { fileList } = await wx.cloud.getTempFileURL({ fileList: [src] })
    url = fileList[0].tempFileURL
  }

  const innerAudioContext = wx.createInnerAudioContext()
  innerAudioContext.src = url
  innerAudioContext.onEnded(() => innerAudioContext.destroy())
  innerAudioContext.onError((err) => {
    console.error('播放失败:', err)
    innerAudioContext.destroy()
  })
  innerAudioContext.play()
}

module.exports = {
  startRecord,
  stopRecord,
  uploadAudio,
  playAudio
}
