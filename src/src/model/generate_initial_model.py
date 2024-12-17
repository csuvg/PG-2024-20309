import nltk
import json
import os

nltk.download('punkt')
nltk.download('brown') # This is the corpus

from nltk.corpus import brown

model_output_path = os.path.join(os.getcwd(), 'initial-ngram-model.json')

sentences = brown.sents()
sentences = [[word.lower() for word in sentence] for sentence in sentences]

ngrams = {}
for token_list in sentences:
    for i in range(len(token_list) - 1):
        word = token_list[i]
        next_word = token_list[i + 1]

        if word not in ngrams:
            ngrams[word] = {}
        if next_word not in ngrams[word]:
            ngrams[word][next_word] = 0
        ngrams[word][next_word] += 1

with open(model_output_path, 'w', encoding='utf-8') as f:
    json.dump(ngrams, f, ensure_ascii=False, indent=2)

print('Saved to', model_output_path) # Hay que moverlo a resources