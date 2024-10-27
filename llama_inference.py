from flask import Flask, request, jsonify
from transformers import GPT2Tokenizer, GPT2LMHeadModel

# Initialize Flask app
app = Flask(__name__)

# Load pre-trained model and tokenizer
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")

@app.route('/generate', methods=['POST'])
def generate_text():
    # Get input data
    data = request.json
    input_text = data.get("input_text", "").strip()

    # Validate input
    if not input_text:
        return jsonify({"error": "Input text is empty"}), 400

    # Tokenize input text
    inputs = tokenizer(input_text, return_tensors="pt")

    # Generate text with improved parameters
    outputs = model.generate(
        **inputs,
        max_length=100,
        temperature=0.7,
        top_k=50,
        num_return_sequences=1,
        do_sample=True  # Enables sampling
    )

    # Decode generated text
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return jsonify({"generated_text": generated_text})

if __name__ == '__main__':
    # Run the app on port 5001
    app.run(host='127.0.0.1', port=5001, debug=True)
