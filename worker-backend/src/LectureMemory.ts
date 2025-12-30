interface ChatRequest {
  message: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatHistory {
  messages: ChatMessage[];
}

export class LectureMemory {
  state: DurableObjectState;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Chat endpoint
    if (path === '/chat' && request.method === 'POST') {
      try {
        const { message } = (await request.json()) as ChatRequest;

        // Define the storage key for the chat history
        const HISTORY_KEY = "chat_history";

        // Retrieve the existing history (or initialize if there is not)
        let history = (await this.state.storage.get<ChatHistory>(HISTORY_KEY)) || {messages: []};

        // Append the new user message
        const userMessage: ChatMessage = {
          role: 'user',
          content: message,
          timestamp: Date.now()
        };

        // Add the user message to the history
        history.messages.push(userMessage);

        // Save the updated history back to storage
        await this.state.storage.put(HISTORY_KEY, history);

        // return new Response(JSON.stringify({
        //   response: `Received message: "${message}". Ready for memory implementation.`,
        //   doId: this.state.id.toString()
        // }), {
        //   headers: { 'Content-Type': 'application/json' },
        // });

        return new Response(JSON.stringify({
          response: "User message saved to history.",
          history: history.messages,
          doId: this.state.id.toString()
        }), {
          headers: {'Content-Type': 'application/json'}
        })
      } catch (error) {
        console.error('Error processing chat request:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({
          error: 'Failed to process chat request',
          details: errorMessage
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Fallback
    return new Response("LectureMemory DO is active, but no action matched.", { status: 200 });
  }
}
