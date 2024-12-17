import nltk
import json
import os

# Ensure the Brown corpus is downloaded
nltk.download('punkt')
nltk.download('brown')

from nltk.corpus import brown

# Define the output path for your n-gram model
model_output_path = os.path.join(os.getcwd(), 'initial-trigram-model.json')

# Get the sentences from the Brown corpus
sentences = brown.sents()
# Convert all words to lowercase
sentences = [[word.lower() for word in sentence] for sentence in sentences]

# Build the n-gram model (trigrams)
ngrams = {}

for token_list in sentences:
    for i in range(len(token_list) - 2):
        word = token_list[i]
        next_word = token_list[i + 1]
        next_next_word = token_list[i + 2]

        if word not in ngrams:
            ngrams[word] = {}
        if next_word not in ngrams[word]:
            ngrams[word][next_word] = {}
        if next_next_word not in ngrams[word][next_word]:
            ngrams[word][next_word][next_next_word] = 0
        ngrams[word][next_word][next_next_word] += 1

# Save the n-gram model to a JSON file
with open(model_output_path, 'w', encoding='utf-8') as f:
    json.dump(ngrams, f, ensure_ascii=False, indent=2)

print('Initial n-gram model generated and saved to', model_output_path) # Hay que moverlo a resources