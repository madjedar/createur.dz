import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn()
    }
  };
});

import { supabase } from '../lib/supabase';
import { getUserConversations, getProfileById, sendMessage } from './dbService';

const BRAND_UUID = 'a1111111-1111-4111-8111-111111111111';
const CREATOR_1_UUID = 'b2222222-2222-4222-8222-222222222222';
const CREATOR_2_UUID = 'c3333333-3333-4333-8333-333333333333';

describe('dbService Messaging & Conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfileById', () => {
    it('returns null if no userId or invalid UUID provided', async () => {
      expect(await getProfileById(null)).toBeNull();
      expect(await getProfileById('not-a-uuid')).toBeNull();
    });

    it('fetches profile by user valid UUID', async () => {
      const mockProfile = { id: CREATOR_1_UUID, full_name: 'Amine Creator', role: 'creator' };
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      });

      const res = await getProfileById(CREATOR_1_UUID);
      expect(res).toEqual(mockProfile);
    });
  });

  describe('getUserConversations', () => {
    it('returns empty array if no userId or invalid UUID provided', async () => {
      expect(await getUserConversations(null)).toEqual([]);
      expect(await getUserConversations('invalid-id')).toEqual([]);
    });

    it('processes and groups messages into conversation partners', async () => {
      const mockMessages = [
        {
          id: 'msg-2',
          sender_id: CREATOR_1_UUID,
          receiver_id: BRAND_UUID,
          text: 'أهلاً وسهلاً، يسعدني ذلك!',
          created_at: '2026-09-02T10:05:00Z',
          sender: { id: CREATOR_1_UUID, full_name: 'Sarah Creator', avatar_url: 'https://example.com/sarah.jpg' },
          receiver: { id: BRAND_UUID, brand_name: 'My Store' }
        },
        {
          id: 'msg-1',
          sender_id: BRAND_UUID,
          receiver_id: CREATOR_1_UUID,
          text: 'مرحباً، نود التعاون معك',
          created_at: '2026-09-02T10:00:00Z',
          sender: { id: BRAND_UUID, brand_name: 'My Store' },
          receiver: { id: CREATOR_1_UUID, full_name: 'Sarah Creator', avatar_url: 'https://example.com/sarah.jpg' }
        },
        {
          id: 'msg-3',
          sender_id: CREATOR_2_UUID,
          receiver_id: BRAND_UUID,
          text: 'السلام عليكم',
          created_at: '2026-09-01T15:00:00Z',
          sender: { id: CREATOR_2_UUID, full_name: 'Karim Tech', avatar_url: 'https://example.com/karim.jpg' },
          receiver: { id: BRAND_UUID, brand_name: 'My Store' }
        }
      ];

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockMessages, error: null })
          })
        })
      });

      const convos = await getUserConversations(BRAND_UUID);
      expect(convos).toHaveLength(2);
      
      // First partner should be CREATOR_1 (latest message at 10:05)
      expect(convos[0].id).toBe(CREATOR_1_UUID);
      expect(convos[0].full_name).toBe('Sarah Creator');
      expect(convos[0].lastMessage).toBe('أهلاً وسهلاً، يسعدني ذلك!');

      // Second partner should be CREATOR_2
      expect(convos[1].id).toBe(CREATOR_2_UUID);
      expect(convos[1].full_name).toBe('Karim Tech');
      expect(convos[1].lastMessage).toBe('السلام عليكم');
    });
  });

  describe('sendMessage', () => {
    it('throws error if missing required parameters or invalid UUIDs', async () => {
      await expect(sendMessage(null, CREATOR_1_UUID, 'hi')).rejects.toThrow();
      await expect(sendMessage(BRAND_UUID, null, 'hi')).rejects.toThrow();
      await expect(sendMessage('invalid', CREATOR_1_UUID, 'hi')).rejects.toThrow();
      await expect(sendMessage(BRAND_UUID, CREATOR_1_UUID, '')).rejects.toThrow();
    });

    it('inserts message and dispatches notification to receiver', async () => {
      const insertedMsg = [{ id: 'msg-100', sender_id: BRAND_UUID, receiver_id: CREATOR_1_UUID, text: 'Hello' }];

      // Mock message insert
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: insertedMsg, error: null })
      });
      // Mock notification insert
      const notifInsertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 'notif-1' }], error: null })
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'messages') {
          return { insert: insertMock };
        }
        if (table === 'notifications') {
          return { insert: notifInsertMock };
        }
        return { insert: vi.fn() };
      });

      const res = await sendMessage(BRAND_UUID, CREATOR_1_UUID, 'Hello');
      expect(res).toEqual(insertedMsg);
      expect(insertMock).toHaveBeenCalledWith([{
        sender_id: BRAND_UUID,
        receiver_id: CREATOR_1_UUID,
        text: 'Hello'
      }]);
    });
  });
});
