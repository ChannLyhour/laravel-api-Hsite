import { client } from "../client";

export interface UserBrief {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  image?: string;
  is_online: boolean;
  last_seen_at?: string | null;
}

export interface Reaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  user: {
    id: number;
    name: string;
  } | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  message_type: 'text' | 'image' | 'audio';
  body?: string;
  media_url?: string | null;
  is_pinned?: boolean;
  reply_to_message_id?: number | null;
  reply_to_message?: {
    id: number;
    body?: string;
    message_type: 'text' | 'image' | 'audio';
    media_url?: string | null;
    sender?: {
      id: number;
      name: string;
    } | null;
  } | null;
  reactions?: Reaction[];
  created_at: string;
}

export interface Conversation {
  id: number;
  store_id: number | null;
  is_group: boolean;
  title: string | null;
  created_at: string;
  updated_at: string;
  other_user: UserBrief;
  last_message: Message | null;
  unread_count: number;
  pusher_key?: string | null;
  pusher_cluster?: string | null;
}

export const chatService = {
  /**
   * Retrieve all conversations the current user is a part of.
   * GET /api/chat/conversations
   */
  async getMyConversations(): Promise<Conversation[]> {
    return client.get<Conversation[]>('/chat/conversations');
  },

  /**
   * Start a 1-on-1 chat conversation with a store owner.
   * POST /api/chat/conversations
   */
  async startConversation(storeId: number | string): Promise<{ id: number; store_id: number | null; is_group: boolean }> {
    return client.post<{ id: number; store_id: number | null; is_group: boolean }>('/chat/conversations', {
      store_id: storeId,
    });
  },

  /**
   * Delete/Close a conversation.
   * DELETE /api/chat/conversations/{id}
   */
  async deleteConversation(conversationId: number): Promise<{ message: string }> {
    return client.delete<{ message: string }>(`/chat/conversations/${conversationId}`);
  },

  /**
   * Get all messages for a specific conversation.
   * GET /api/chat/conversations/{id}/messages
   */
  async getMessages(conversationId: number, limit?: number, beforeId?: number): Promise<Message[]> {
    const params: Record<string, any> = {};
    if (limit !== undefined) params.limit = limit;
    if (beforeId !== undefined) params.before_id = beforeId;
    const query = new URLSearchParams(params).toString();
    return client.get<Message[]>(`/chat/conversations/${conversationId}/messages${query ? `?${query}` : ''}`);
  },

  /**
   * Send a message to a conversation.
   * POST /api/chat/conversations/{id}/messages
   */
  async sendMessage(
    conversationId: number,
    body?: string,
    messageType: 'text' | 'image' | 'audio' = 'text',
    mediaUrl?: string,
    replyToMessageId?: number
  ): Promise<Message> {
    return client.post<Message>(`/chat/conversations/${conversationId}/messages`, {
      body,
      message_type: messageType,
      media_url: mediaUrl,
      reply_to_message_id: replyToMessageId,
    });
  },

  /**
   * Upload chat media attachment.
   * POST /api/chat/upload
   */
  async uploadChatImage(file: File): Promise<{ url: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return client.postFormData<{ url: string; path: string }>('/chat/upload', formData);
  },

  /**
   * Delete a message.
   * DELETE /api/chat/messages/{messageId}
   */
  async deleteMessage(messageId: number): Promise<{ message: string }> {
    return client.delete<{ message: string }>(`/chat/messages/${messageId}`);
  },

  /**
   * Pin/unpin a message.
   * POST /api/chat/messages/{messageId}/pin
   */
  async togglePinMessage(messageId: number): Promise<{ id: number; is_pinned: boolean; message: string }> {
    return client.post<{ id: number; is_pinned: boolean; message: string }>(`/chat/messages/${messageId}/pin`);
  },

  /**
   * React or toggle reaction on a message.
   * POST /api/chat/messages/{messageId}/react
   */
  async reactToMessage(messageId: number, emoji: string): Promise<{ success: boolean; message_id: number; reactions: Reaction[] }> {
    return client.post<{ success: boolean; message_id: number; reactions: Reaction[] }>(`/chat/messages/${messageId}/react`, {
      emoji,
    });
  },

  /**
   * Poll online presence for a list of user IDs directly from DB.
   * GET /api/chat/user-status?user_ids[]=4
   * Replaces the Pusher UserStatusUpdated broadcast.
   */
  async getUserStatus(userIds: number[]): Promise<{ user_id: number; is_online: boolean; last_seen_at: string | null }[]> {
    const params = userIds.map(id => `user_ids[]=${id}`).join('&');
    return client.get<{ user_id: number; is_online: boolean; last_seen_at: string | null }[]>(
      `/chat/user-status?${params}`
    );
  },
};
