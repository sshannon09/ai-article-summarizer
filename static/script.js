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
            // Call each model individually to prevent memory overload
            const [geminiResponse, chatgptResponse, claudeResponse] = await Promise.all([
                fetch('/summarize/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }),
                fetch('/summarize/chatgpt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }),
                fetch('/summarize/claude', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            ]);

            // Process responses
            const geminiData = geminiResponse.ok ? await geminiResponse.json() : { summary: 'Error loading Gemini summary' };
            const chatgptData = chatgptResponse.ok ? await chatgptResponse.json() : { summary: 'Error loading ChatGPT summary' };
            const claudeData = claudeResponse.ok ? await claudeResponse.json() : { summary: 'Error loading Claude summary' };

            // Save article text from any successful response
            originalArticleText = geminiData.article_text || chatgptData.article_text || claudeData.article_text || '';

            geminiSummary.textContent = geminiData.summary;
            chatgptSummary.textContent = chatgptData.summary;
            claudeSummary.textContent = claudeData.summary;

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
            // Call each model individually for refinement
            const refinementPayload = { text: originalArticleText, prompt: prompt };
            
            const [geminiResponse, chatgptResponse, claudeResponse] = await Promise.all([
                fetch('/summarize/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(refinementPayload)
                }),
                fetch('/summarize/chatgpt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(refinementPayload)
                }),
                fetch('/summarize/claude', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(refinementPayload)
                })
            ]);

            // Process responses
            const geminiData = geminiResponse.ok ? await geminiResponse.json() : { summary: 'Error refining Gemini summary' };
            const chatgptData = chatgptResponse.ok ? await chatgptResponse.json() : { summary: 'Error refining ChatGPT summary' };
            const claudeData = claudeResponse.ok ? await claudeResponse.json() : { summary: 'Error refining Claude summary' };

            geminiSummary.textContent = geminiData.summary;
            chatgptSummary.textContent = chatgptData.summary;
            claudeSummary.textContent = claudeData.summary;

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
