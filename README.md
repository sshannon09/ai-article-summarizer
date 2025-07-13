# Article Summarizer

This web application summarizes articles from a given URL using three different AI models: Gemini, ChatGPT, and Claude.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd article-summarizer
    ```

2.  **Create a virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up your API keys:**
    -   Rename the `.env.example` file to `.env`.
    -   Add your API keys for Google Gemini, OpenAI, and Anthropic to the `.env` file.

## Running the Application

1.  **Start the Flask server:**
    ```bash
    python app.py
    ```

2.  **Open your browser:**
    -   Navigate to `http://127.0.0.1:5000` to use the application.
