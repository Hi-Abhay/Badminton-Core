import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { dark, light } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import { get_api, post_api, patch_api, WS_BASE_URL } from '../../utils/api';

const KEYBOARD_VERTICAL_OFFSET = 0;

const formatMessageTime = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

// ========================================================
// SKELETON LOADER COMPONENT
// ========================================================
const ChatSkeleton = ({ colors }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  // Dummy array to render placeholder bubbles
  const skeletonData = [
    { id: 1, isMe: true, width: '60%' },
    { id: 2, isMe: false, width: '40%' },
    { id: 3, isMe: true, width: '75%' },
    { id: 4, isMe: false, width: '50%' },
    { id: 5, isMe: false, width: '65%' },
  ];

  return (
    <View style={styles.skeletonContainer}>
      {skeletonData.map((item) => (
        <View key={item.id} style={item.isMe ? styles.sentRow : styles.receivedRow}>
          <Animated.View
            style={[
              item.isMe ? styles.sentBubble : styles.receivedBubble,
              {
                backgroundColor: item.isMe ? colors.accentBg : colors.bgSurface,
                borderColor: item.isMe ? 'transparent' : colors.borderColor,
                opacity: pulseAnim,
                width: item.width,
                height: 40,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const Converstation = ({ navigation, route }) => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;

  const auth = useSelector((state) => state?.auth);
  const currentUserId = auth?.user?._id || auth?.user?.id || auth?.id || auth?._id;
  const token = auth?.token;

  const partner = route?.params?.user?.player || route?.params?.partner || route?.params?.user || {};
  const recipientId = partner?._id || partner?.id || route?.params?.recipientId;

  const [conversationId, setConversationId] = useState(route?.params?.conversationId || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(!!partner?.isOnline);

  const flatListRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // ========================================================
  // 1. ACCESS / CREATE 1v1 CONVERSATION CHANNEL
  // ========================================================
  const initConversation = useCallback(async () => {
    if (!recipientId || !token) return null;

    try {
      // Attempt to load from cache immediately so the UI is instantly ready
      let cId = conversationId;

      if (!cId) {
        const res = await post_api('/chats/access', { recipientId }, token);
        if (res?.success && res?.conversation?._id) {
          cId = res.conversation._id;
          setConversationId(cId);
        }
      }

      if (cId) {
        const cached = await AsyncStorage.getItem(`@chat_${cId}`);
        if (cached) {
          setMessages(JSON.parse(cached));
          setLoading(false); // Disable skeleton if we have offline data
        }

        // Fetch fresh data in the background to sync
        fetchMessages(cId);
        return cId;
      }
    } catch (error) {
      // Handle error quietly
    } finally {
      // Safety catch to remove skeleton if everything fails
      setLoading(false);
    }
    return null;
  }, [recipientId, token, conversationId]);

  // ========================================================
  // 2. FETCH PAGINATED MESSAGE HISTORY & SYNC
  // ========================================================
  const fetchMessages = async (cId, beforeTimestamp = null) => {
    if (!cId || !token) return;

    try {
      if (beforeTimestamp) setLoadingMore(true);

      let endpoint = `/chats/${cId}/messages?limit=30`;
      if (beforeTimestamp) endpoint += `&before=${encodeURIComponent(beforeTimestamp)}`;

      const res = await get_api(endpoint, token);

      if (res?.success && Array.isArray(res?.messages)) {
        const formatted = [...res.messages].reverse();

        if (beforeTimestamp) {
          setMessages((prev) => [...prev, ...formatted]);
        } else {
          // SYNC FIX: Merge fresh network messages without overwriting pending local ones
          setMessages((prev) => {
            const pendingLocal = prev.filter(
              (m) => m.tempId && (m.status === 'sending' || m.status === 'failed')
            );
            return [...pendingLocal, ...formatted];
          });
          markConversationAsRead(cId);
        }
        setHasMore(res.hasMore ?? false);
      }
    } catch (error) {
      // Error fetching
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore || messages.length === 0 || !conversationId) return;
    const oldestMsg = messages[messages.length - 1];
    if (oldestMsg?.createdAt) {
      fetchMessages(conversationId, oldestMsg.createdAt);
    }
  };

  const markConversationAsRead = (cId) => {
    if (!cId) return;
    patch_api(`/chats/${cId}/read`, {}, token).catch(() => { });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'mark_read', conversationId: cId, recipientId }));
    }
  };

  useEffect(() => {
    initConversation();
  }, [initConversation]);

  // SYNC FIX: Auto-save the newest 50 messages whenever the chat successfully updates
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const saveCache = async () => {
        try {
          await AsyncStorage.setItem(`@chat_${conversationId}`, JSON.stringify(messages.slice(0, 50)));
        } catch (error) {
          // Failed cache save
        }
      };
      saveCache();
    }
  }, [messages, conversationId]);

  // ========================================================
  // 3. REAL-TIME WEBSOCKET MULTIPLEXING
  // ========================================================
  useEffect(() => {
    if (!token) return;

    const wsUrl = `${WS_BASE_URL}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (conversationId) {
        ws.send(JSON.stringify({ action: 'mark_read', conversationId, recipientId }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, message, tempId, fromUserId, readBy } = data;

        if (type === 'message_sent_ack') {
          setMessages((prev) => prev.map((m) =>
            m._id === tempId || m.tempId === tempId ? { ...message, tempId: null, status: data.status || message.status } : m
          ));
        } else if (type === 'new_message' && message) {
          const isThisChat = String(data.conversationId) === String(conversationId) || String(message.conversationId) === String(conversationId);
          if (isThisChat) {
            setMessages((prev) => [message, ...prev]);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ action: 'mark_read', conversationId, recipientId }));
            }
          }
        } else if (type === 'messages_read') {
          if (String(readBy) === String(recipientId)) {
            setMessages((prev) => prev.map((m) => (m.status !== 'read' ? { ...m, status: 'read' } : m)));
          }
        } else if (type === 'typing' && String(fromUserId) === String(recipientId)) {
          setIsPartnerTyping(true);
        } else if (type === 'stop_typing' && String(fromUserId) === String(recipientId)) {
          setIsPartnerTyping(false);
        }
      } catch (err) { }
    };

    ws.onclose = () => { wsRef.current = null; };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, conversationId, recipientId]);

  // ========================================================
  // 4. ROBUST SEND MESSAGE PIPELINE (WS + REST FALLBACK)
  // ========================================================
  const handleSend = async (retryMessage = null) => {
    const textToSend = retryMessage ? retryMessage.text : inputText.trim();
    if (!textToSend || !recipientId) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = await initConversation();
      if (!activeConvId) return;
    }

    const tempId = retryMessage?.tempId || retryMessage?._id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (!retryMessage) {
      const optimisticMsg = {
        _id: tempId,
        tempId,
        conversationId: activeConvId,
        sender: { _id: currentUserId },
        recipient: recipientId,
        text: textToSend,
        mediaType: 'text',
        status: 'sending',
        createdAt: new Date().toISOString(),
        isMe: true,
      };

      setMessages((prev) => [optimisticMsg, ...prev]);
      setInputText('');
      handleStopTyping();
    } else {
      setMessages((prev) => prev.map((m) => (m._id === tempId ? { ...m, status: 'sending' } : m)));
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'send_message', conversationId: activeConvId, recipientId, text: textToSend, tempId }));
    } else {
      try {
        const res = await post_api(`/chats/${activeConvId}/messages`, { recipientId, text: textToSend, mediaType: 'text' }, token);
        if (res?.success && res?.message) {
          setMessages((prev) => prev.map((m) => m._id === tempId || m.tempId === tempId ? { ...res.message, tempId: null } : m));
        } else {
          markMessageFailed(tempId);
        }
      } catch (apiErr) {
        markMessageFailed(tempId);
      }
    }
  };

  const markMessageFailed = (tempId) => {
    setMessages((prev) => prev.map((m) => m._id === tempId || m.tempId === tempId ? { ...m, status: 'failed' } : m));
  };

  // ========================================================
  // 5. TYPING INDICATOR & KEYBOARD HANDLING
  // ========================================================
  const handleInputChange = (text) => {
    setInputText(text);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !conversationId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      wsRef.current.send(JSON.stringify({ action: 'typing', conversationId, recipientId }));
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { handleStopTyping(); }, 1800);
  };

  const handleStopTyping = () => {
    if (isTypingRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      isTypingRef.current = false;
      wsRef.current.send(JSON.stringify({ action: 'stop_typing', conversationId, recipientId }));
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const showSub = Keyboard.addListener(showEvent, () => {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    });
    return () => { showSub.remove(); };
  }, []);

  // ========================================================
  // 6. RENDER
  // ========================================================
  const renderMessageItem = ({ item }) => {
    if (item.type === 'challenge' || item.mediaType === 'challenge') {
      return (
        <View style={styles.challengeWrapper}>
          <View style={[styles.challengeCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
            <View style={styles.challengeHeader}>
              <View style={[styles.challengeIconCircle, { backgroundColor: colors.bgBase }]}>
                <Ionicons name="trophy-outline" size={16} color={colors.textPrimary} />
              </View>
              <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>{item.title || 'Match Challenge'}</Text>
            </View>
            <Text style={[styles.challengeDetails, { color: colors.textSecondary }]}>{item.details || item.text}</Text>
            <View style={[styles.challengeStatusBadge, { backgroundColor: colors.bgBase }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.challengeStatusText, { color: colors.success }]}>Accepted</Text>
            </View>
          </View>
          <Text style={[styles.bubbleTimeCenter, { color: colors.textTertiary }]}>{formatMessageTime(item.createdAt)}</Text>
        </View>
      );
    }

    const senderId = typeof item.sender === 'object' ? item.sender?._id : item.sender;
    const isMe = item.isMe || String(senderId) === String(currentUserId);
    const msgTime = formatMessageTime(item.createdAt);

    if (isMe) {
      const isRead = item.status === 'read';
      const isDelivered = item.status === 'delivered';
      const isSending = item.status === 'sending';
      const isFailed = item.status === 'failed';

      return (
        <View style={styles.sentRow}>
          <View style={[styles.sentBubble, { backgroundColor: colors.accentBg }]}>
            <Text style={[styles.sentText, { color: colors.accentText }]}>{item.text}</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.metaTime, { color: colors.accentText, opacity: 0.75 }]}>{msgTime}</Text>
              {isFailed ? (
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleSend(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" style={styles.receiptIcon} />
                </TouchableOpacity>
              ) : isSending ? (
                <Ionicons name="time-outline" size={12} color={colors.accentText} style={[styles.receiptIcon, { opacity: 0.7 }]} />
              ) : (
                <Ionicons name={isRead || isDelivered ? 'checkmark-done' : 'checkmark'} size={14} color={isRead ? '#38BDF8' : colors.accentText} style={styles.receiptIcon} />
              )}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.receivedRow}>
        <View style={[styles.receivedBubble, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
          <Text style={[styles.receivedText, { color: colors.textPrimary }]}>{item.text}</Text>
          <Text style={[styles.metaTime, { color: colors.textTertiary, alignSelf: 'flex-end' }]}>{msgTime}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={handleEdges ? handleEdges() : ['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <View style={[styles.header, { backgroundColor: colors.bgSurface, borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.partnerProfile}>
          <View style={styles.avatarWrap}>
            {partner?.profile_image || partner?.avatar ? (
              <Image source={{ uri: partner?.profile_image || partner?.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.bgBase, borderColor: colors.borderColor }]}>
                <Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>{(partner?.fullName || '?')[0].toUpperCase()}</Text>
              </View>
            )}
            {partnerOnline && <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.bgSurface }]} />}
          </View>
          <View style={styles.partnerDetails}>
            <Text numberOfLines={1} style={[styles.partnerName, { color: colors.textPrimary }]}>{partner?.fullName || 'Player'}</Text>
          </View>
        </View>
        <View style={styles.headerRightActions}>
          <TouchableOpacity activeOpacity={0.7} style={styles.actionIconBtn} onPress={() => navigation.navigate('CreateMatch', { opponentId: recipientId })}>
            <Ionicons name="trophy-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flexContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET}>
        {loading ? (
          <ChatSkeleton colors={colors} />
        ) : (
          <FlatList
            ref={flatListRef}
            style={styles.messagesList}
            data={messages}
            inverted
            keyExtractor={(item) => item._id || item.tempId || String(Math.random())}
            renderItem={renderMessageItem}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.messageListContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={colors.textTertiary} style={{ marginVertical: 12 }} /> : null}
          />
        )}
        <View style={[styles.inputBarContainer]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
            <TextInput value={inputText} onChangeText={handleInputChange} placeholder="Message partner..." placeholderTextColor={colors.textTertiary} numberOfLines={1} style={[styles.textInput, { color: colors.textPrimary }]} />
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={() => handleSend()} disabled={!inputText.trim()} style={[styles.sendBtn, { backgroundColor: colors.accentBg, opacity: inputText.trim() ? 1 : 0.4 }]}>
            <Ionicons name="arrow-up" size={20} color={colors.accentText} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Converstation;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexContainer: { flex: 1 },
  messagesList: { flex: 1 },

  // Skeleton Styles
  skeletonContainer: { flex: 1, paddingHorizontal: 16, paddingBottom: 24, justifyContent: 'flex-end' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 6, marginRight: 4 },
  partnerProfile: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarWrap: { position: 'relative', marginRight: 10 },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 16, fontWeight: '700' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 5.5, borderWidth: 2 },
  partnerDetails: { flex: 1 },
  partnerName: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.3 },
  partnerStatus: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIconBtn: { padding: 8 },
  messageListContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  sentRow: { alignItems: 'flex-end', marginBottom: 10 },
  sentBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderBottomRightRadius: 4 },
  sentText: { fontSize: 14.5 },
  receivedRow: { alignItems: 'flex-start', marginBottom: 10 },
  receivedBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderBottomLeftRadius: 4, borderWidth: 1 },
  receivedText: { fontSize: 14.5, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end' },
  metaTime: { fontSize: 10.5, marginTop: 4 },
  receiptIcon: { marginLeft: 4 },
  challengeWrapper: { marginVertical: 12, alignItems: 'center' },
  challengeCard: { width: '90%', borderRadius: 16, borderWidth: 1, padding: 14 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  challengeIconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  challengeTitle: { fontSize: 14, fontWeight: '700' },
  challengeDetails: { fontSize: 12.5, marginBottom: 10, lineHeight: 18 },
  challengeStatusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 5 },
  challengeStatusText: { fontSize: 11.5, fontWeight: '700' },
  bubbleTimeCenter: { fontSize: 11 },
  inputBarContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  attachBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  inputWrapper: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 8 : 10, maxHeight: 100 },
  textInput: { fontSize: 14.5, padding: 0 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});