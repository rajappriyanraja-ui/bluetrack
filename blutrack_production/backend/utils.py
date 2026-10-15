import tensorflow as tf
import numpy as np
import cv2
from tensorflow.keras.models import Model
import matplotlib.pyplot as plt

class GradCAM:
    def __init__(self, model, layer_name=None):
        self.model = model
        self.layer_name = layer_name or self.find_last_conv_layer()

    def find_last_conv_layer(self):
        """Find the last convolutional layer in the model"""
        for layer in reversed(self.model.layers):
            if 'conv' in layer.name.lower():
                return layer.name
        raise ValueError("No convolutional layer found in model")

    def compute_heatmap(self, image, class_idx=None, eps=1e-8):
        """
        Compute Grad-CAM heatmap for the given image
        """
        # Get the target layer
        grad_model = Model(
            inputs=[self.model.inputs],
            outputs=[self.model.get_layer(self.layer_name).output, self.model.output]
        )

        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(image)
            if class_idx is None:
                # For regression, use the output directly
                loss = predictions[0][0]
            else:
                loss = predictions[:, class_idx]

        # Compute gradients
        grads = tape.gradient(loss, conv_outputs)

        # Global average pooling of gradients
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        # Weight the convolutional outputs
        conv_outputs = conv_outputs[0]
        heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)

        # ReLU and normalize
        heatmap = tf.maximum(heatmap, 0) / (tf.reduce_max(heatmap) + eps)

        return heatmap.numpy()

    def overlay_heatmap(self, heatmap, image, alpha=0.4):
        """
        Overlay heatmap on original image
        """
        # Resize heatmap to match image size
        heatmap = cv2.resize(heatmap, (image.shape[1], image.shape[0]))

        # Convert to RGB
        heatmap = np.uint8(255 * heatmap)
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

        # Overlay
        overlay = cv2.addWeighted(image, 1 - alpha, heatmap, alpha, 0)

        return overlay

    def generate_explanation(self, health_score):
        """
        Generate human-readable explanation based on health score
        """
        if health_score >= 90:
            return "Excellent condition. Minimal visible damage detected."
        elif health_score >= 80:
            return "Very good condition. Light surface variations detected."
        elif health_score >= 70:
            return "Good condition. Some surface degradation visible."
        elif health_score >= 60:
            return "Fair condition. Moderate surface damage detected."
        elif health_score >= 50:
            return "Poor condition. Significant surface degradation."
        else:
            return "Critical condition. Severe damage detected across surface."

def create_heatmap_overlay(image_path, model, target_size=(224, 224)):
    """
    Create heatmap overlay for an image
    """
    # Load and preprocess image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")

    original_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Resize for model
    resized_img = cv2.resize(original_img, target_size)
    resized_img = resized_img.astype(np.float32) / 255.0
    input_img = np.expand_dims(resized_img, axis=0)

    # Create GradCAM instance
    gradcam = GradCAM(model)

    # Compute heatmap
    heatmap = gradcam.compute_heatmap(input_img)

    # Overlay on original image
    overlay = gradcam.overlay_heatmap(heatmap, original_img)

    return overlay, gradcam.generate_explanation(model.predict(input_img)[0][0])