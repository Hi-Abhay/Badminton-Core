import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { light, dark } from '../../theme/Color';
import { get_api } from '../../utils/api';
import { useSelector } from 'react-redux';

// Subcomponents
import MutualTab from './components/MutualTab';
import SentTab from './components/SentTab';
import RequestTab from './components/RequestTab';
import { useRoute } from '@react-navigation/native';

const TABS = ['Mutual Connection', 'Sent', 'Request'];

const Friends = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const user = useSelector((state) => state?.auth);
  const route = useRoute();

  const getValidTab = (filter) => {
    const normalized = String(filter || '').toLowerCase();

    switch (normalized) {
      case 'mutual':
      case 'mutual connection':
        return 'Mutual Connection';

      case 'sent':
        return 'Sent';

      case 'request':
      case 'requests':
      case 'pending':
        return 'Request';

      default:
        return 'Mutual Connection';
    }
  };

  const [activeTab, setActiveTab] = useState(() =>
    getValidTab(route.params?.filter)
  );

  useEffect(() => {
    if (route.params?.filter) {
      setActiveTab(getValidTab(route.params.filter));
    }
  }, [route.params?.filter]);

  const [mutual, setMutual] = useState({});
  const [sent, setSent] = useState({});
  const [request, setRequest] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mutual_List = mutual?.friends || [];
  const sent_List = sent?.requests || [];
  const request_List = request?.requests || [];

  const get_mutual = async () => {
    try {
      const res = await get_api('/connections', user?.token);
      if (res?.success) setMutual(res);
    } catch (error) {
      console.log('Error fetching mutual:', error);
    }
  };

  const get_sent = async () => {
    try {
      const res = await get_api('/connections/sent', user?.token);
      if (res?.success) setSent(res);
    } catch (error) {
      // console.log('Error fetching sent:', error);
    }
  };

  const get_req = async () => {
    try {
      const res = await get_api('/connections/pending', user?.token);
      if (res?.success) setRequest(res);
    } catch (error) {
      console.log('Error fetching requests:', error);
    }
  };

  const fetchAllData = useCallback(async () => {
    await Promise.all([get_mutual(), get_sent(), get_req()]);
  }, [user?.token]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAllData();
      setLoading(false);
    };
    init();
  }, [fetchAllData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleCancelSent = (id) => {
    setSent((prev) => ({
      ...prev,
      requests: (prev?.requests || []).filter(
        (item) => (item?.id || item?._id || item?.connectionId) !== id
      ),
    }));
  };

  const handleAcceptRequest = (item, rawSender) => {
    const id = item?._id || item?.id || item?.connectionId;

    setRequest((prev) => ({
      ...prev,
      requests: (prev?.requests || []).filter(
        (req) => (req?._id || req?.id || req?.connectionId) !== id
      ),
    }));

    setMutual((prev) => ({
      ...prev,
      friends: [
        {
          connectionId: id,
          connectedSince: new Date().toISOString(),
          player: rawSender,
        },
        ...(prev?.friends || []),
      ],
    }));
  };

  const handleDeclineRequest = (id) => {
    setRequest((prev) => ({
      ...prev,
      requests: (prev?.requests || []).filter(
        (item) => (item?._id || item?.id || item?.connectionId) !== id
      ),
    }));
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bgBase }]}
      edges={['top']}
    >
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgSurface}
      />

      {/* Screen Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.bgSurface,
            borderBottomColor: colors.borderColor,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation?.openDrawer()}
          style={styles.headerBtn}
        >
          <Ionicons name="menu" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Connections
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tab Switcher */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.bgSurface,
            borderBottomColor: colors.borderColor,
          },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                isActive && {
                  borderBottomColor: colors.accentBg,
                  borderBottomWidth: 2.5,
                },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.textPrimary : colors.textTertiary },
                  isActive && styles.activeTabText,
                ]}
                numberOfLines={1}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Render Selected Component */}
      {activeTab === 'Mutual Connection' && (
        <MutualTab
          data={mutual_List}
          colors={colors}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onCall={(player) => console.log('Call player:', player?.fullName)}
          onMessage={(player) => console.log('Message player:', player?.fullName)}
        />
      )}

      {activeTab === 'Sent' && (
        <SentTab
          data={sent_List}
          colors={colors}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onCancel={handleCancelSent}
        />
      )}

      {activeTab === 'Request' && (
        <RequestTab
          data={request_List}
          colors={colors}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onAccept={handleAcceptRequest}
          onDecline={handleDeclineRequest}
        />
      )}
    </SafeAreaView>
  );
};

export default Friends;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '800',
  },
});