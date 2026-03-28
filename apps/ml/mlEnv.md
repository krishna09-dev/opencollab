# OpenCollab ML - Conda Environment Setup

## Quick Setup (3 Commands)

### STEP 1: Create Environment
```bash
conda create -n opencollab-ml python=3.11 -y
```

### STEP 2: Activate Environment
```bash
conda activate opencollab-ml
```

### STEP 3: Install All Required Packages
```bash
conda install pandas numpy scikit-learn nltk matplotlib seaborn wordcloud sentence-transformers jupyter -y
```

---

## Packages Installed
- **pandas** - Data manipulation and analysis
- **numpy** - Numerical computing
- **scikit-learn** - Machine learning (TF-IDF, cosine similarity)
- **nltk** - Natural Language Toolkit (stopwords, stemming)
- **matplotlib** - Data visualization
- **seaborn** - Statistical visualization
- **wordcloud** - Word cloud generation
- **sentence-transformers** - Sentence-BERT embeddings (semantic similarity)
- **jupyter** - Jupyter Notebooks for development