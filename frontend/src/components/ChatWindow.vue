<script setup>
import { ref, nextTick } from 'vue'

const messages = ref([
  {
    sender: 'phoebe',
    text: "Hi, I'm Phoebe — your FUPRE information assistant. Ask me about registration, exams, hostel, fees, or results.",
  },
])
const inputText = ref('')
const isLoading = ref(false)
const messageList = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  messages.value.push({ sender: 'user', text })
  inputText.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    })

    if (!res.ok) {
      throw new Error(`Server responded with status ${res.status}`)
    }

    const data = await res.json()
    messages.value.push({ sender: 'phoebe', text: data.response })
  } catch (err) {
    messages.value.push({
      sender: 'phoebe',
      text: "Sorry, I can't reach the server right now. Please check your connection and try again.",
      isError: true,
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<template>
  <div class="mx-auto flex h-screen w-full max-w-md flex-col bg-white shadow-lg">
    <header class="flex-shrink-0 bg-emerald-900 px-4 py-3 text-white">
      <h1 class="text-lg font-semibold">Phoebe</h1>
      <p class="text-xs text-emerald-200">FUPRE Student Assistant</p>
    </header>

    <main ref="messageList" class="flex-1 space-y-2 overflow-y-auto bg-slate-100 p-4">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="flex"
        :class="msg.sender === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm"
          :class="
            msg.sender === 'user'
              ? 'rounded-br-sm bg-emerald-700 text-white'
              : msg.isError
                ? 'rounded-bl-sm border border-red-200 bg-red-50 text-red-800'
                : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
          "
        >
          {{ msg.text }}
        </div>
      </div>

      <div v-if="isLoading" class="flex justify-start">
        <div class="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]"></span>
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]"></span>
        </div>
      </div>
    </main>

    <form
      class="flex flex-shrink-0 gap-2 border-t border-slate-200 bg-white p-3"
      @submit.prevent="sendMessage"
    >
      <input
        v-model="inputText"
        type="text"
        placeholder="Ask about registration, exams, hostel, fees..."
        :disabled="isLoading"
        class="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-emerald-700 disabled:opacity-60"
      />
      <button
        type="submit"
        :disabled="isLoading"
        class="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Send
      </button>
    </form>
  </div>
</template>
