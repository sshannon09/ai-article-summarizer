document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('summarize-form');
    const inputTypeRadios = document.querySelectorAll('input[name="input-type"]');
    const urlSection = document.getElementById('url-section');
    const textSection = document.getElementById('text-section');
    const followUpSection = document.getElementById('follow-up-section');
    const followUpForm = document.getElementById('follow-up-form');

    let originalArticleText = ''; // Variable to store the article text

    // Handle switching between URL and Text inputs
    inputTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'url') {
                urlSection.classList.remove('hidden');
                textSection.classList.add('hidden');
            } else {
                urlSection.classList.add('hidden');
                textSection.classList.remove('hidden');
            }
        });
    });

    // --- Initial Summarization --- 
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const loading = document.getElementById('loading');
        const geminiSummary = document.getElementById('gemini-summary');
        const chatgptSummary = document.getElementById('chatgpt-summary');
        const claudeSummary = document.getElementById('claude-summary');

        loading.classList.remove('hidden');
        followUpSection.classList.add('hidden');
        geminiSummary.textContent = '';
        chatgptSummary.textContent = '';
        claudeSummary.textContent = '';

        const selectedType = document.querySelector('input[name="input-type"]:checked').value;
        let payload = {};

        if (selectedType === 'url') {
            const url = document.getElementById('url-input').value;
            if (!url) { alert('Please enter a URL.'); loading.classList.add('hidden'); return; }
            payload = { url: url };
        } else {
            const text = document.getElementById('text-input').value;
            if (!text) { alert('Please paste some text.'); loading.classList.add('hidden'); return; }
            payload = { text: text };
        }

        try {
            const response = await fetch('/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred.');
            }

            const data = await response.json();
            originalArticleText = data.article_text; // Save the article text

            geminiSummary.textContent = data.gemini_summary;
            chatgptSummary.textContent = data.chatgpt_summary;
            claudeSummary.textContent = data.claude_summary;

            followUpSection.classList.remove('hidden'); // Show the follow-up form

        } catch (error) {
            console.error('Error:', error);
            const errorMessage = `An error occurred: ${error.message}`;
            geminiSummary.textContent = errorMessage;
            chatgptSummary.textContent = errorMessage;
            claudeSummary.textContent = errorMessage;
        } finally {
            loading.classList.add('hidden');
        }
    });

    // --- Follow-up Refinement --- 
    followUpForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const prompt = document.getElementById('follow-up-input').value;
        if (!prompt) { alert('Please enter a follow-up instruction.'); return; }

        const loading = document.getElementById('loading');
        const geminiSummary = document.getElementById('gemini-summary');
        const chatgptSummary = document.getElementById('chatgpt-summary');
        const claudeSummary = document.getElementById('claude-summary');

        loading.classList.remove('hidden');
        geminiSummary.textContent = 'Refining...';
        chatgptSummary.textContent = 'Refining...';
        claudeSummary.textContent = 'Refining...';

        const payload = { text: originalArticleText, prompt: prompt };

        try {
            const response = await fetch('/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred.');
            }

            const data = await response.json();

            geminiSummary.textContent = data.gemini_summary;
            chatgptSummary.textContent = data.chatgpt_summary;
            claudeSummary.textContent = data.claude_summary;

        } catch (error) {
            console.error('Error:', error);
            const errorMessage = `An error occurred: ${error.message}`;
            geminiSummary.textContent = errorMessage;
            chatgptSummary.textContent = errorMessage;
            claudeSummary.textContent = errorMessage;
        } finally {
            loading.classList.add('hidden');
        }
    });
});
