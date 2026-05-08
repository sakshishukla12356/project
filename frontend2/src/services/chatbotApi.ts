import { apiClient } from "./api"

export type ChatbotResponse = {
  user_id: number
  response: {
    message: string
    insights?: string[]
    actions?: Array<{ label: string; type: string; provider: string; resource_id: string }>
    note?: string
  }
}

export const chatbotApi = {
  async chat(message: string) {
    const { data } = await apiClient.post<ChatbotResponse>("/ai/chatbot/chat", { message })
    return data
  },
}

