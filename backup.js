<FlatList
        data={historicalLogs}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyCalories}>Total Points: {item.totalCalories}</Text>
          </View>
        )}
      />