import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import cv2
import os

class BluTrackCNN:
    def __init__(self, input_shape=(224, 224, 3)):
        self.input_shape = input_shape
        self.model = None

    def build_model(self):
        """Build MobileNetV2-based CNN for disc health prediction"""
        # Load pre-trained MobileNetV2 without top layers
        base_model = MobileNetV2(weights='imagenet', include_top=False,
                                input_shape=self.input_shape)

        # Freeze base model layers initially
        for layer in base_model.layers:
            layer.trainable = False

        # Add custom head for regression
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(512, activation='relu')(x)
        x = Dropout(0.3)(x)
        x = Dense(256, activation='relu')(x)
        x = Dropout(0.2)(x)
        predictions = Dense(1, activation='linear')(x)  # Regression output

        self.model = Model(inputs=base_model.input, outputs=predictions)

        # Compile with MSE loss for regression
        self.model.compile(optimizer=Adam(learning_rate=1e-4),
                          loss='mean_squared_error',
                          metrics=['mae', 'mse'])

        return self.model

    def create_data_generators(self, train_dir, val_dir, batch_size=32):
        """Create data generators with augmentation"""
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.1,
            height_shift_range=0.1,
            brightness_range=[0.8, 1.2],
            horizontal_flip=True,
            fill_mode='nearest'
        )

        val_datagen = ImageDataGenerator(rescale=1./255)

        train_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=self.input_shape[:2],
            batch_size=batch_size,
            class_mode='sparse',  # For regression, we'll handle labels separately
            shuffle=True
        )

        val_generator = val_datagen.flow_from_directory(
            val_dir,
            target_size=self.input_shape[:2],
            batch_size=batch_size,
            class_mode='sparse',
            shuffle=False
        )

        return train_generator, val_generator

    def preprocess_image(self, image_path):
        """Preprocess single image for inference"""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image: {image_path}")

        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, self.input_shape[:2])
        img = img.astype(np.float32) / 255.0
        img = np.expand_dims(img, axis=0)

        return img

    def predict_health(self, image_path):
        """Predict health score from image"""
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")

        processed_img = self.preprocess_image(image_path)
        prediction = self.model.predict(processed_img)[0][0]

        # Clamp to 0-100 range
        health_score = np.clip(prediction, 0, 100)

        return float(health_score)

    def save_model(self, filepath):
        """Save model to file"""
        if self.model is None:
            raise ValueError("No model to save")
        self.model.save(filepath)

    def load_model(self, filepath):
        """Load model from file"""
        self.model = tf.keras.models.load_model(filepath)
        return self.model

    def fine_tune(self, trainable_layers=50):
        """Unfreeze layers for fine-tuning"""
        if self.model is None:
            raise ValueError("Model not built")

        # Unfreeze last N layers
        for layer in self.model.layers[-trainable_layers:]:
            layer.trainable = True

        # Recompile with lower learning rate
        self.model.compile(optimizer=Adam(learning_rate=1e-5),
                          loss='mean_squared_error',
                          metrics=['mae', 'mse'])

        return self.model