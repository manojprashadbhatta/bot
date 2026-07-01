class MicroShieldBot {
    constructor() {
        this.faqs = [];
        this.threshold = 0.60; // Absolute 60% verification boundary

        // Run initializer once the window/DOM context is safe
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        // Bind the UI first so the send button works immediately
        this.bindUserInterface();
        // Load the JSON data asynchronously
        await this.loadKnowledgeBase();
    }

    bindUserInterface() {
        const sendButton = document.getElementById('send-btn');
        const inputElement = document.getElementById('user-input');

        if (!sendButton || !inputElement) {
            console.error("MicroShield Error: Cannot find input elements in the DOM.");
            return;
        }

        // Mouse click listener
        sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.processQuery(inputElement);
        });

        // Keyboard Enter listener
        inputElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent accidental form submissions
                this.processQuery(inputElement);
            }
        });
    }

    async loadKnowledgeBase() {
        try {
            const response = await fetch('faq.json');
            if (!response.ok) throw new Error("Status " + response.status);
            this.faqs = await response.json();
            
            console.log("⚡ MicroShield AI: Knowledge base loaded and armed.");
        } catch (error) {
            console.error("MicroShield AI Error: Failed to fetch faq.json.", error);
            this.renderMessage("SYSTEM WARNING: Local knowledge base offline. Ensure you are running a local web server to fetch JSON files.", 'bot-msg');
        }
    }

    processQuery(input) {
        const cleanQuery = input.value.trim();
        if (!cleanQuery) return;

        // 1. Push operator message up visually immediately
        this.renderMessage(cleanQuery, 'user-msg');
        input.value = '';

        // 2. Process response with a slight mechanical delay
        setTimeout(() => {
            if (this.faqs.length === 0) {
                this.renderMessage("System offline: I cannot process queries without access to faq.json. Are you running a local server?", 'bot-msg');
                return;
            }
            
            const systemResponse = this.evaluateProbabilityMatch(cleanQuery);
            this.renderMessage(systemResponse, 'bot-msg');
        }, 400);
    }

    renderMessage(messageText, layoutClass) {
        const chatContainer = document.getElementById('chat-box');
        if (!chatContainer) return;

        const wrapper = document.createElement('div');
        wrapper.className = `msg-bubble ${layoutClass}`;
        wrapper.textContent = messageText;

        chatContainer.appendChild(wrapper);
        // Auto-scroll to the newest message
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    evaluateProbabilityMatch(query) {
        let absoluteTopScore = 0;
        let matchedPayload = "";

        // Loop through faq.json and score each question
        for (const item of this.faqs) {
            const similarityScore = this.calculateDiceCoefficient(query, item.q);
            if (similarityScore > absoluteTopScore) {
                absoluteTopScore = similarityScore;
                matchedPayload = item.a;
            }
        }

        // If the best match is 60% or higher, return the answer
        if (absoluteTopScore >= this.threshold && matchedPayload !== "") {
            return matchedPayload;
        }

        // Fallback for low-probability queries
        return "sorry, i couldn't able to find such query 🥺, go in contact section and contact our team";
    }

    // Sørensen–Dice Coefficient algorithm for string similarity
    calculateDiceCoefficient(inputString, targetString) {
        const cleanPattern = (rawText) => rawText.toLowerCase().replace(/[^a-z0-9]/g, '');
        const textA = cleanPattern(inputString);
        const textB = cleanPattern(targetString);

        if (textA === textB) return 1.0;
        if (textA.length < 2 || textB.length < 2) return 0.0;

        const buildBigramMap = (evaluatedText) => {
            const trackingSet = new Set();
            for (let index = 0; index < evaluatedText.length - 1; index++) {
                trackingSet.add(evaluatedText.substring(index, index + 2));
            }
            return trackingSet;
        };

        const pairsA = buildBigramMap(textA);
        const pairsB = buildBigramMap(textB);

        let matchingSegments = 0;
        pairsA.forEach(pair => {
            if (pairsB.has(pair)) matchingSegments++;
        });

        return (2.0 * matchingSegments) / (pairsA.size + pairsB.size);
    }
}

// Fire up engine instance
new MicroShieldBot();
