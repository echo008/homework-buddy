// __mocks__/openai.js
module.exports = {
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '[]' } }]
        })
      }
    }
  }))
}
