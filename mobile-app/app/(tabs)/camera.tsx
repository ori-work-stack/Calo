
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { analyzeMeal, postMeal, clearPendingMeal } from '../../src/store/mealSlice';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { pendingMeal, isAnalyzing, isPosting } = useSelector((state: RootState) => state.meal);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setShowCamera(false);
          dispatch(analyzeMeal(photo.uri));
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      dispatch(analyzeMeal(result.assets[0].uri));
    }
  };

  const handlePost = async () => {
    if (pendingMeal) {
      await dispatch(postMeal());
      Alert.alert('Success', 'Meal posted successfully!');
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Analysis',
      'Are you sure you want to discard this analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => dispatch(clearPendingMeal()) },
      ]
    );
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
            >
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  if (pendingMeal) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.analysisContainer}>
          <Image source={{ uri: pendingMeal.imageUri }} style={styles.analyzedImage} />
          
          <View style={styles.analysisResults}>
            <Text style={styles.analysisTitle}>Analysis Results</Text>
            
            <Text style={styles.mealName}>{pendingMeal.analysis.name}</Text>
            {pendingMeal.analysis.description && (
              <Text style={styles.mealDescription}>{pendingMeal.analysis.description}</Text>
            )}
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(pendingMeal.analysis.calories)}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(pendingMeal.analysis.protein)}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(pendingMeal.analysis.carbs)}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(pendingMeal.analysis.fat)}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.discardButton]}
              onPress={handleDiscard}
              disabled={isPosting}
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.postButton]}
              onPress={handlePost}
              disabled={isPosting}
            >
              {isPosting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.postButtonText}>Post Meal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analyze Your Meal</Text>
      <Text style={styles.subtitle}>
        Take a photo or select from gallery to get nutrition analysis
      </Text>
      
      {isAnalyzing && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.analyzingText}>Analyzing your meal...</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => setShowCamera(true)}
          disabled={isAnalyzing}
        >
          <Ionicons name="camera" size={30} color="white" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={pickImage}
          disabled={isAnalyzing}
        >
          <Ionicons name="images" size={30} color="#007AFF" />
          <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
  },
  closeButton: {
    padding: 10,
  },
  flipButton: {
    padding: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  galleryButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  galleryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  analyzingContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  analyzingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  analysisContainer: {
    padding: 20,
  },
  analyzedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  analysisResults: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  mealDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  discardButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  postButton: {
    backgroundColor: '#28a745',
  },
  discardButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
