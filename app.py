from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv, find_dotenv
import os
import sys
import requests
from bs4 import BeautifulSoup
import gc


# Load environment variables from .env file if it exists. 
# This is primarily for local development.
load_dotenv()

app = Flask(__name__)





# --- Helper function to get article text ---
def get_article_text(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, verify=False)
        response.raise_for_status()  # Raise an exception for bad status codes
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all paragraph tags and join their text
        paragraphs = soup.find_all('p')
        article_text = ' '.join([p.get_text() for p in paragraphs])
        return article_text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching URL: {e}")
        return None

# --- Summarization function for Gemini ---
def summarize_with_gemini(text, prompt="You are an AI assistant tasked with generating concise, executive-level summaries of articles related to Artificial Intelligence. Given a URL link to an article or copy/pasted text, create a paragraph-form summary that is roughly 5 to 10 sentences in length. Your summary should highlight key changes, their implications, and clearly explain why these developments matter to executive-level stakeholders. Prioritize clarity, relevance, and impact, ensuring executives quickly grasp the significance of the information."):
    import google.generativeai as genai
    google_key = os.getenv("GOOGLE_API_KEY")
    if not google_key:
        return "Gemini API key not configured."
    try:
        genai.configure(api_key=google_key)
        model = genai.GenerativeModel('gemini-2.5-pro')
        response = model.generate_content(f"{prompt}\n\nArticle:\n\n{text}")
        return response.text
    except Exception as e:
        import traceback
        print("[ERROR] Gemini API Exception:")
        traceback.print_exc()
        print(f"[ERROR] Gemini API Exception details: {e}")
        return f"Error generating summary with Gemini. Check if the API key is valid. ({e})"

# --- Summarization function for ChatGPT ---
def summarize_with_chatgpt(text, prompt="You are an AI assistant tasked with generating concise, executive-level summaries of articles related to Artificial Intelligence. Given a URL link to an article or copy/pasted text, create a paragraph-form summary that is roughly 5 to 10 sentences in length. Your summary should highlight key changes, their implications, and clearly explain why these developments matter to executive-level stakeholders. Prioritize clarity, relevance, and impact, ensuring executives quickly grasp the significance of the information."):
    import openai
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        return "OpenAI API key not configured or is invalid."
    try:
        client = openai.OpenAI(api_key=openai_key)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant. You will be given an article and an instruction. Follow the instruction based on the article provided."},
                {"role": "user", "content": f"Instruction: {prompt}\n\nArticle:\n\n{text}"}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error with OpenAI API: {e}")
        return "Error generating summary with ChatGPT. Check if the API key is valid."

# --- Summarization function for Claude ---
def summarize_with_claude(text, prompt="You are an AI assistant tasked with generating concise, executive-level summaries of articles related to Artificial Intelligence. Given a URL link to an article or copy/pasted text, create a paragraph-form summary that is roughly 5 to 10 sentences in length. Your summary should highlight key changes, their implications, and clearly explain why these developments matter to executive-level stakeholders. Prioritize clarity, relevance, and impact, ensuring executives quickly grasp the significance of the information."):
    import anthropic
    claude_api_key = os.getenv("ANTHROPIC_API_KEY")
    if not claude_api_key:
        return "Anthropic API key not configured or is invalid."
    
    claude_client = anthropic.Anthropic(api_key=claude_api_key)
    try:
        message = claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"Instruction: {prompt}\n\nArticle:\n\n{text}"
                }
            ]
        )
        return message.content[0].text
    except Exception as e:
        import traceback
        print("[ERROR] Claude API Exception:")
        traceback.print_exc()
        print(f"[ERROR] Claude API Exception details: {e}")
        return f"Error generating summary with Claude. Check if the API key is valid. ({e})"

@app.route('/')
def index():
    return render_template('index.html')

# Individual model endpoints for memory efficiency
@app.route('/summarize/gemini', methods=['POST'])
def summarize_gemini():
    data = request.get_json()
    url = data.get('url')
    text = data.get('text')
    prompt = data.get('prompt')

    if url:
        article_text = get_article_text(url)
        if not article_text:
            return jsonify({'error': 'Failed to extract article text from the URL.'}), 400
    elif text:
        article_text = text
    else:
        return jsonify({'error': 'Either URL or text must be provided.'}), 400

    # If a custom prompt is provided, use it. Otherwise, the function's default will be used.
    if prompt:
        summary = summarize_with_gemini(article_text, prompt)
    else:
        summary = summarize_with_gemini(article_text)
    gc.collect()  # Force garbage collection
    
    return jsonify({
        'summary': summary,
        'article_text': article_text
    })

@app.route('/summarize/chatgpt', methods=['POST'])
def summarize_chatgpt():
    data = request.get_json()
    url = data.get('url')
    text = data.get('text')
    prompt = data.get('prompt')

    if url:
        article_text = get_article_text(url)
        if not article_text:
            return jsonify({'error': 'Failed to extract article text from the URL.'}), 400
    elif text:
        article_text = text
    else:
        return jsonify({'error': 'Either URL or text must be provided.'}), 400

    # If a custom prompt is provided, use it. Otherwise, the function's default will be used.
    if prompt:
        summary = summarize_with_chatgpt(article_text, prompt)
    else:
        summary = summarize_with_chatgpt(article_text)
    gc.collect()  # Force garbage collection
    
    return jsonify({
        'summary': summary,
        'article_text': article_text
    })

@app.route('/summarize/claude', methods=['POST'])
def summarize_claude():
    data = request.get_json()
    url = data.get('url')
    text = data.get('text')
    prompt = data.get('prompt')

    if url:
        article_text = get_article_text(url)
        if not article_text:
            return jsonify({'error': 'Failed to extract article text from the URL.'}), 400
    elif text:
        article_text = text
    else:
        return jsonify({'error': 'Either URL or text must be provided.'}), 400

    # If a custom prompt is provided, use it. Otherwise, the function's default will be used.
    if prompt:
        summary = summarize_with_claude(article_text, prompt)
    else:
        summary = summarize_with_claude(article_text)
    gc.collect()  # Force garbage collection
    
    return jsonify({
        'summary': summary,
        'article_text': article_text
    })

# Legacy endpoint - kept for compatibility but not recommended
@app.route('/summarize', methods=['POST'])
def summarize():
    return jsonify({'error': 'This endpoint has been deprecated. Use individual model endpoints instead.'}), 400

@app.route('/refine', methods=['POST'])
def refine():
    return jsonify({'error': 'This endpoint has been deprecated. Use individual model endpoints instead.'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
