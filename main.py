from flask import Flask, request, jsonify
import util
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('/classify_image', methods=['GET', 'POST'])
def classify_image():
    if request.method == 'POST':
        # Check if 'image_data' is in the request
        #if 'image_data' not in request.form:
            #return jsonify({"error": "No image data provided"}), 400

        image_data = request.form['image_data']

        # Call your utility function to classify the image
        classification_result = util.classify_image(image_data)

        # Create a response
        response = jsonify(classification_result)
        print("Classification Result:", classification_result)  # Print the result for debugging

        # Add CORS headers
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response
    else:
        return jsonify({"message": "GET method not supported"}), 405  # Method Not Allowed for GET


if __name__ == "__main__":
    print("Starting Python Flask Server For Sports Celebrity Image Classification")
    util.load_saved_artifacts()
    app.run(port=5003)
