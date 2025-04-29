import os
from flask import Flask, request, render_template
import pandas as pd
import numpy as np
from PIL import Image
import io

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# Load crop prices dataset (assuming 'modal_price' is the price per quintal)
price_df = pd.read_csv("data/crop_prices.csv")

# Dummy crop labels (expand this based on your model)
crop_classes = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Onion']

# Dummy prediction logic (replace with ML model later)
def predict_crop(image_path):
    filename = os.path.basename(image_path).lower()
    for crop in crop_classes:
        if crop.lower() in filename:
            return crop
    return np.random.choice(crop_classes)  # Default if no crop is detected

def predict_price(crop_name):
    # Get the modal price for the given crop
    crop_prices = price_df[price_df['crop'].str.lower() == crop_name.lower()]['modal_price']
    if not crop_prices.empty:
        return round(crop_prices.mean(), 2)  # Return the average price for the crop
    return None  # Return None if crop not found

@app.route("/", methods=['GET', 'POST'])
def index():
    predicted_crop = predicted_price = None
    image_path = None
    quantity = None
    total_price = None
    data_source = ""

    if request.method == 'POST':
        # Handle image upload and prediction
        file = request.files.get('file', None)
        crop_name = request.form.get('crop_name', '').strip()

        # If an image is uploaded
        if file and file.filename.endswith(('.jpg', '.png', '.jpeg')):  # Image file validation
            # Save the uploaded image
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(image_path)
            
            # Predict crop type from the uploaded image (dummy method here)
            predicted_crop = predict_crop(image_path)
            data_source = "Predicted from uploaded image."
        
        # If crop name is provided by the user
        elif crop_name:
            predicted_crop = crop_name
            data_source = "Predicted from crop name (CSV)."

        # Fetch the price for the predicted crop
        if predicted_crop:
            predicted_price = predict_price(predicted_crop)

        # Handle quantity input
        quantity = request.form.get('quantity', '')

        # If quantity is provided, calculate the total price
        if quantity and predicted_price is not None:
            try:
                # If the quantity is given in quintals
                quantity_in_quintals = 0
                quantity_in_kg = 0

                if 'quintal' in quantity.lower():
                    quantity_in_quintals = float(quantity.replace("quintal", "").strip())
                    quantity_in_kg = quantity_in_quintals * 100  # Convert quintals to kg
                else:
                    quantity_in_kg = float(quantity)

                # Calculate total price using price per quintal or per kg
                if quantity_in_kg > 0:
                    total_price = predicted_price * (quantity_in_kg / 100)  # Price per quintal
                    total_price = round(total_price, 2)
            except ValueError:
                total_price = "Invalid quantity format"

    if not data_source:
        data_source = "Predicted from crop price dataset (CSV)."

    # Price per kilogram calculation (based on the price per quintal)
    price_per_kg = predicted_price / 100 if predicted_price else None

    return render_template("index.html", 
                           crop=predicted_crop, 
                           price=predicted_price, 
                           price_per_kg=price_per_kg, 
                           total_price=total_price, 
                           image_path=image_path, 
                           data_source=data_source, 
                           crop_classes=crop_classes)

if __name__ == "__main__":
    app.run(debug=True)
