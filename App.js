// Calorie Tracker App using React Native

import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native';
import 'react-native-gesture-handler';
//import { Swipeable } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 300,
  fade: true,
});


const Tab = createBottomTabNavigator();

const HomeScreen = ({ foodName, setFoodName, calories, setCalories, addRecipe, dailyGoal, setDailyGoal, saveDailyGoal }) => (
  <View style={styles.container}>
    <Text style={styles.sectionTitle}>Add Food/Recipe</Text>
    <TextInput
      style={styles.input}
      placeholder="Food Name"
      value={foodName}
      onChangeText={setFoodName}
    />
    <TextInput
      style={styles.input}
      placeholder="Points"
      keyboardType="numeric"
      value={calories}
      onChangeText={setCalories}
    />
    <Button title="Add Recipe" color="#a8c480" onPress={addRecipe} />

    <Text style={styles.sectionTitle}>Set Your Daily Goal</Text>
    <TextInput
      style={styles.input}
      placeholder="Points"
      keyboardType="numeric"
      value={dailyGoal}
      onChangeText={setDailyGoal}
    />
    <Button title="Set Goal" color="#a8c480" onPress={saveDailyGoal} />


  </View>
);

const RecipesScreen = ({ recipes, logRecipe, removeRecipe }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Available Recipes</Text>
      <TextInput
        style={styles.input}
        placeholder="Search Recipes"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.id, removeRecipe)}>
          <View style={styles.recipeItem}>
            <Text style={styles.recipeText} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text><Text style={styles.recipeTextcal}> {item.calories} P</Text>
            <View style={styles.recipeButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => logRecipe(item)}
              >
                <Icon name="checkmark-circle-outline" size={24} color="green" />
                <Text style={styles.buttonText}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
          </Swipeable>
        )}
      />
    </View>
  );
};

const DailyLogScreen = ({ dailyLog, removeFromLog, calculateTotalCalories, logDate, dailyGoal }) => {
  const [historicalLogs, setHistoricalLogs] = useState([]);

  React.useEffect(() => {
    const loadHistoricalLogs = async () => {
      try {
        const storedLogs = await AsyncStorage.getItem('logs');
        if (storedLogs) {
          const parsedLogs = JSON.parse(storedLogs);
          const today = new Date();
          const todayString = today.toISOString().split('T')[0];
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
    
          // Filter logs to only include entries from the last seven days and exclude the current date
          const filteredLogs = Object.entries(parsedLogs)
            .filter(([date]) => new Date(date) >= sevenDaysAgo && date !== todayString)
            .map(([date, logs]) => ({
              date,
              totalCalories: logs.reduce((total, item) => total + item.calories, 0),
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort in descending order by date
    
          setHistoricalLogs(filteredLogs);
          
          // Save the filtered logs back to AsyncStorage
          const filteredLogsObject = filteredLogs.reduce((acc, { date, totalCalories }) => {
            acc[date] = parsedLogs[date];
            return acc;
          }, {});
          await AsyncStorage.setItem('logs', JSON.stringify(filteredLogsObject));
        }
      } catch (error) {
        console.error('Error loading historical logs:', error);
      }
    };

    loadHistoricalLogs();
  }, [logDate]);

  const totalCalories = calculateTotalCalories();
  const goal = parseInt(dailyGoal, 10) || 0;

  let calorieColor = 'black';
  if (totalCalories <= goal) {
    calorieColor = 'green'
  }
  else if (totalCalories <= goal + 3) {
      calorieColor = 'orange'
  }
  else {
    calorieColor = 'red'
  }
  
  return (
  <View style={styles.container}>
    <Text style={styles.sectionTitle}>Daily Log ({logDate})</Text>
    <View style={styles.dailyLogContainer}>
    { dailyLog.length === 0 ? (
      <View>
      <Text style={styles.noEntriesText}>No entries...please have some food.</Text>
      <Text style={styles.noEntriesText}>You must be starving.</Text></View>
    ) : (
    <FlatList
      data={dailyLog}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
        <View style={styles.recipeItem}>
          <Text style={styles.recipeText} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text><Text style={[styles.recipeTextcal, {marginRight: 10}]}> {item.calories} P</Text>
          <Button title="Remove" color="#a8c480" onPress={() => removeFromLog(index)} />
        </View>
      )}
    />
    )}
    </View>
    <View style={styles.totalContainer}>
    <Text style={styles.totalCalories}><Text style={styles.totalCalories}>Total Points Today:</Text><Text style={[styles.totalCalories, { color: calorieColor },]}> {totalCalories}</Text></Text>
    <Text style={styles.goalText}>Daily Goal: {dailyGoal || 'Not Set'}</Text>
    </View>
    <Text style={styles.sectionTitle}>Previous Logs</Text>
    
      <FlatList
        data={historicalLogs}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyCalories}><Text style={styles.historyCalories}>Total Points:</Text><Text style={styles.historyCalories}> {item.totalCalories}</Text></Text>
          </View>
        )}
      />
  </View>
  );
};

const App = () => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [dailyLog, setDailyLog] = useState([]);
  const [logDate, setLogDate] = useState('');

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const storedRecipes = await AsyncStorage.getItem('recipes');
        const storedLogs = await AsyncStorage.getItem('logs');
        const storedGoal = await AsyncStorage.getItem('dailyGoal');
        const today = new Date().toISOString().split('T')[0];

        if (storedRecipes) setRecipes(JSON.parse(storedRecipes));

        if (storedLogs) {
          const parsedLogs = JSON.parse(storedLogs);
          if (parsedLogs[today]) {
            setDailyLog(parsedLogs[today]);
          } else {
            setDailyLog([]);
          }
        } else {
          await AsyncStorage.setItem('logs', JSON.stringify({}));
        }

        if (storedGoal) setDailyGoal(storedGoal);

        setLogDate(today);
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Hide the splash screen after the delay
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const saveDailyLog = async (updatedLog) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedLogs = await AsyncStorage.getItem('logs');
      const logs = storedLogs ? JSON.parse(storedLogs) : {};
      logs[today] = updatedLog;

      // Remove logs older than seven days
      const currentDate = new Date();
      const sevenDaysAgo = new Date(currentDate);
      sevenDaysAgo.setDate(currentDate.getDate() - 7);

      Object.keys(logs).forEach((date) => {
        if (new Date(date) < sevenDaysAgo) {
          delete logs[date];
        }
      });

      await AsyncStorage.setItem('logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving daily log:', error);
    }
  };

  const addRecipe = async () => {
    if (foodName.trim() && calories.trim() && !isNaN(calories)) {
      const newRecipe = { id: Date.now().toString(), name: foodName, calories: parseInt(calories) };
      const updatedRecipes = [...recipes, newRecipe];
      setRecipes(updatedRecipes);
      await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
      setFoodName('');
      setCalories('');
    } else {
      alert('Please enter valid food and calorie values!');
    }
  };

  const saveDailyGoal = async () => {
    try {
      await AsyncStorage.setItem('dailyGoal', dailyGoal);
      alert('Daily goal saved!');
    } catch (error) {
      console.error('Error saving daily goal:', error);
    }
  };

  const logRecipe = (recipe) => {
    const updatedDailyLog = [...dailyLog, recipe];
    setDailyLog(updatedDailyLog);
    saveDailyLog(updatedDailyLog);
  };

  const removeRecipe = async (id) => {
    const recipeToRemove = recipes.find((recipe) => recipe.id === id);
    
    if (!recipeToRemove) return;
  
    Alert.alert(
      "Remove Recipe",
      `Are you sure you want to remove "${recipeToRemove.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const updatedRecipes = recipes.filter((recipe) => recipe.id !== id);
            setRecipes(updatedRecipes);
            await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
          },
        },
      ]
    );
  };  

  const removeFromLog = (index) => {
    const updatedDailyLog = dailyLog.filter((_, i) => i !== index);
    setDailyLog(updatedDailyLog);
    saveDailyLog(updatedDailyLog);
  };

  const calculateTotalCalories = () => {
    return dailyLog.reduce((total, item) => total + item.calories, 0);
  };

  const TotalCaloriesBanner = () => {
    const totalCalories = calculateTotalCalories();
    const goal = parseInt(dailyGoal, 10) || 0;

    let calorieColor = 'black';
    if (totalCalories <= goal) {
      calorieColor = 'green'
    }
    else if (totalCalories <= goal + 3) {
        calorieColor = 'orange'
    }
    else {
      calorieColor = 'red'
    }

    return (
    <View style={styles.bottomBanner}>
      <Text><Text style={styles.bannerText}>Total Points Today:</Text><Text style={[styles.totalCalories, { color: calorieColor },]}> {totalCalories}</Text></Text>
    </View>
  );
}

  return (
    <GestureHandlerRootView>
    <NavigationContainer>
      <View style={styles.topBanner}>
        <Text style={styles.bannerText}>FoodLog</Text>
      </View>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = 'home-outline';
            } else if (route.name === 'Recipes') {
              iconName = 'fast-food-outline';
            } else if (route.name === 'Daily Log') {
              iconName = 'clipboard-outline';
            }

            return <Icon name={iconName} size={size} color="#a8c480"/>;
          },
          tabBarActiveTintColor: "#a8c480",
        })}
      >
        <Tab.Screen name="Home">
          {() => (
            <HomeScreen
              foodName={foodName}
              setFoodName={setFoodName}
              calories={calories}
              setCalories={setCalories}
              addRecipe={addRecipe}
              dailyGoal={dailyGoal}
              setDailyGoal={setDailyGoal}
              saveDailyGoal={saveDailyGoal}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Recipes">
          {() => (
            <RecipesScreen
              recipes={recipes}
              logRecipe={logRecipe}
              removeRecipe={removeRecipe}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Daily Log">
          {() => (
            <DailyLogScreen
              dailyLog={dailyLog}
              removeFromLog={removeFromLog}
              calculateTotalCalories={calculateTotalCalories}
              logDate={logDate}
              dailyGoal={dailyGoal}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
      <TotalCaloriesBanner />
    </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const renderRightActions = (id, removeRecipe) => (
  <TouchableOpacity
    style={styles.deleteButton}
    onPress={() => removeRecipe(id)}
  >
    <Icon name="trash-outline" size={24} color="#fff" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  recipeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  recipeText: {
    flex: 1,
    maxWidth: '100%', // Adjust as needed
    marginRight: 10,
  },
  recipeTextcal: {
    textAlign: 'right',
  },
  recipeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 90,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 15,
    backgroundColor: '#eeeeee',
    borderRadius: 5,
  },
  buttonText: {
    marginLeft: 5,
    fontSize: 14,
  },
  totalContainer: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
  },
  totalCalories: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  goalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  dailyLogContainer: {
    minHeight: '25%',
    maxHeight: '40%',
  },
  noEntriesText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
  },
  historyItem: {
    marginVertical: 8,
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyCalories: {
    fontSize: 14,
    marginTop: 4,
  },
  topBanner: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  bottomBanner: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  bannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    backgroundColor: 'red',
    marginHorizontal: 6,
  },
});

export default App;
