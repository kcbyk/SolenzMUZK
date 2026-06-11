import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ContentCard from '../../components/content/ContentCard';
import { usePlayer } from '../../hooks/usePlayer';
import { useSearch } from '../../hooks/useSearch';

const DEBOUNCE_MS = 400;
const MAX_QUERY_LENGTH = 200;
const MIN_QUERY_LENGTH = 2;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { results, loading, error, doSearch } = useSearch();
  const player = usePlayer();

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        if (text.trim().length >= MIN_QUERY_LENGTH) {
          doSearch(text.trim());
        } else {
          // Clear results when query is too short — useSearch already handles this,
          // but calling with empty string ensures results are reset visually.
          doSearch('');
        }
      }, DEBOUNCE_MS);
    },
    [doSearch],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const overLimit = query.length > MAX_QUERY_LENGTH;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="İçerik ara…"
            placeholderTextColor="#666666"
            value={query}
            onChangeText={handleQueryChange}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            maxLength={MAX_QUERY_LENGTH + 50} // allow typing so we can show warning
          />
        </View>
        {overLimit && (
          <Text style={styles.queryLimitWarning}>
            Sorgu 200 karakterle sınırlıdır
          </Text>
        )}
      </View>

      {/* Content area */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Arama gerçekleştirilemedi, tekrar deneyin</Text>
        </View>
      ) : results.length === 0 && query.trim().length >= MIN_QUERY_LENGTH ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.videoId}
          renderItem={({ item }) => (
            <ContentCard item={item} onPress={() => player.playAudio(item)} />
          )}
          style={styles.list}
          contentContainerStyle={results.length === 0 ? styles.listEmpty : styles.listContent}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 0,
  },
  queryLimitWarning: {
    marginTop: 6,
    fontSize: 12,
    color: '#FF6B6B',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 4,
  },
  listEmpty: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: 108,
  },
});
