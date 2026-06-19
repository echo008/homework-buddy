// tests/setup.js - 测试环境全局 mock

global.wx = {
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn(),
    database: jest.fn(),
    uploadFile: jest.fn()
  },
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  navigateTo: jest.fn(),
  redirectTo: jest.fn(),
  reLaunch: jest.fn(),
  navigateBack: jest.fn(),
  chooseMedia: jest.fn(),
  vibrateShort: jest.fn(),
  createInnerAudioContext: jest.fn(() => ({
    src: '',
    play: jest.fn(),
    onPlay: jest.fn(),
    onEnded: jest.fn(),
    onError: jest.fn(),
    destroy: jest.fn()
  })),
  getBackgroundAudioManager: jest.fn(() => ({
    title: '',
    src: '',
    onEnded: jest.fn(),
    onError: jest.fn()
  }))
}

global.Page = jest.fn((config) => config)
global.App = jest.fn((config) => config)
global.getApp = jest.fn(() => ({ globalData: { openid: 'test_openid' } }))
global.getCurrentPages = jest.fn(() => [])
global.requirePlugin = jest.fn((name) => {
  if (name === 'WechatSI') {
    return {
      textToSpeech: jest.fn((options) => {
        if (options.success) {
          options.success({ filename: 'https://example.com/tts.mp3' })
        }
      })
    }
  }
  return null
})
